package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	rdsTypes "github.com/aws/aws-sdk-go-v2/service/rds/types"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"golang.org/x/mod/semver"
)

var Engines []string = []string{
	"postgres",
	"mysql",
	"mariadb",
	"aurora-mysql",
	"aurora-postgresql",
}

type Node struct {
	Data NodeData `json:"data"`
}

type NodeData struct {
	ID        string `json:"id"`
	BlueGreen bool   `json:"blueGreen"`
}

type Link struct {
	Data LinkData `json:"data"`
}

type LinkData struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

type Tree struct {
	EngineVersions map[string]map[string]EngineVersion `json:"engineVersions"`
}

type EngineVersion struct {
	BlueGreenSupported bool     `json:"blueGreenSupported"`
	UpgradeTargets     []string `json:"upgradeTargets"`
}

func init() {
	logrus.SetReportCaller(false)
	logrus.SetFormatter(&logrus.JSONFormatter{
		DisableTimestamp: true,
	})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.DebugLevel)
}

func isHigherWithinMajor(source, target string) bool {
	s := fmt.Sprintf("v%v", source)
	t := fmt.Sprintf("v%v", target)
	if semver.Major(s) == semver.Major(t) && (semver.Compare(s, t) == 0 || semver.Compare(s, t) == 1) {
		return true
	}
	return false
}

func IsBlueGreenDeploymentSupported(engine, version string) bool {
	var supportedVersions []string

	if engine == "aurora-mysql" {
		return true
	}

	switch engine {
	case "postgres":
		supportedVersions = []string{
			"11.21",
			"12.16",
			"13.12",
			"14.9",
			"15.4",
			"16.1",
		}
	case "mysql":
		supportedVersions = []string{
			"5.7",
			"8.0.15",
		}
	case "mariadb":
		supportedVersions = []string{
			"10.2",
		}
	case "aurora-postgresql":
		supportedVersions = []string{
			"12.16",
			"13.12",
			"14.9",
			"15.4",
		}
	default:
		supportedVersions = []string{}
	}

	for _, v := range supportedVersions {
		if isHigherWithinMajor(version, v) {
			return true
		}
	}

	return false
}

func NewTree(cli *rds.Client) (*Tree, error) {
	tree := Tree{
		EngineVersions: make(map[string]map[string]EngineVersion),
	}
	for _, engine := range Engines {
		tree.EngineVersions[engine] = make(map[string]EngineVersion)
		var marker string

	inner:
		for {
			o, err := cli.DescribeDBEngineVersions(context.Background(), &rds.DescribeDBEngineVersionsInput{
				Engine:     &engine,
				MaxRecords: aws.Int32(100),
				Marker:     &marker,
			})
			if err != nil {
				return nil, errors.Wrapf(err, "failed to describe %v engine versions", engine)
			}

			for _, v := range o.DBEngineVersions {
				targets, err := GetTargets(cli, engine, *v.EngineVersion)
				if err != nil {
					return nil, errors.Wrap(err, "failed to create leaf")
				}
				tree.EngineVersions[engine][*v.EngineVersion] = EngineVersion{
					BlueGreenSupported: IsBlueGreenDeploymentSupported(engine, *v.EngineVersion),
					UpgradeTargets:     targets,
				}
			}

			if o.Marker == nil {
				break inner
			}
		}
	}
	return &tree, nil
}

func GetTargets(cli *rds.Client, engine, version string) ([]string, error) {
	var marker string
	targets := make([]string, 0)

	for {
		o, err := cli.DescribeDBEngineVersions(context.Background(), &rds.DescribeDBEngineVersionsInput{
			Engine:        &engine,
			EngineVersion: &version,
			MaxRecords:    aws.Int32(100),
			Marker:        &marker,
		})
		if err != nil {
			return make([]string, 0), errors.Wrapf(err, "failed to describe valid upgrades for %v %v version", engine, version)
		}

		validUpgradeTargets := make([]rdsTypes.UpgradeTarget, 0)
		for _, e := range o.DBEngineVersions {
			if len(e.SupportedEngineModes) == 0 {
				validUpgradeTargets = append(validUpgradeTargets, e.ValidUpgradeTarget...)
			} else {
				for _, m := range e.SupportedEngineModes {
					if m == "provisioned" {
						validUpgradeTargets = append(validUpgradeTargets, e.ValidUpgradeTarget...)
					}
				}
			}
		}

		for _, t := range validUpgradeTargets {
			if t.EngineVersion != nil {
				targets = append(targets, *t.EngineVersion)
			}
		}

		if o.Marker == nil {
			break
		}
	}

	return targets, nil
}

func main() {
	log := logrus.New()
	log.Info("started")
	ctx := context.Background()

	// TODO: change to Access Key
	cfg, err := config.LoadDefaultConfig(ctx, config.WithSharedConfigProfile("XXX"))
	if err != nil {
		log.Fatal(errors.Wrap(err, "error loading aws config"))
	}
	cli := rds.NewFromConfig(cfg)

	log.Info("generating the tree")
	tree, err := NewTree(cli)
	if err != nil {
		log.Fatal(errors.Wrap(err, "failed to create a tree"))
	}

	postgres := make([]interface{}, 0)
	mysql := make([]interface{}, 0)
	mariadb := make([]interface{}, 0)
	auroraMysql := make([]interface{}, 0)
	auroraPostgresql := make([]interface{}, 0)

	handler := func(versions map[string]EngineVersion, data *[]interface{}, filename string) {
		for version, obj := range versions {
			*data = append(*data, Node{
				Data: NodeData{
					ID:        version,
					BlueGreen: obj.BlueGreenSupported,
				},
			})

			for _, target := range obj.UpgradeTargets {
				*data = append(*data, Link{
					Data: LinkData{
						ID:     fmt.Sprintf("%v-%v", version, target),
						Source: version,
						Target: target,
					},
				})
			}
		}

		file, err := json.MarshalIndent(data, "", "\t")
		if err != nil {
			log.Fatal(errors.Wrapf(err, "failed to marshal %v", filename))
		}

		if err := os.WriteFile(filename, file, 0644); err != nil {
			log.Fatal(errors.Wrapf(err, "failed writing %v file", filename))
		}
	}

	for engine, v := range tree.EngineVersions {
		log.Infof("generating %v graph file", engine)
		filename := fmt.Sprintf("../../public/aws/rds-upgrade-paths/%v.json", engine)

		switch engine {
		case "mysql":
			handler(v, &mysql, filename)
		case "postgres":
			handler(v, &postgres, filename)
		case "mariadb":
			handler(v, &mariadb, filename)
		case "aurora-mysql":
			handler(v, &auroraMysql, filename)
		case "aurora-postgresql":
			handler(v, &auroraPostgresql, filename)
		}
	}

	log.Info("finished")
}
