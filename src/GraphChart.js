import React, { useEffect } from 'react';
import cytoscape from 'cytoscape';

const GraphChart = ({ filename }) => {
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(filename);
                const elements = await response.json();

                const cy = cytoscape({
                    container: document.getElementById('cy'),
                    elements,
                    style: [
                        {
                            selector: 'node',
                            style: {
                                shape: 'circle',
                                label: 'data(id)',
                                'background-color': (ele) =>
                                    ele.data('blueGreen') ? '#008000' : '#808080',
                            },
                        },
                        {
                            selector: 'edge',
                            style: {
                                'width': 2,
                                'curve-style': 'bezier',
                                'target-arrow-shape': 'triangle',
                                'target-arrow-color': '#ccc',
                                'arrow-scale': 1,
                                'line-color': '#ccc',
                            },
                        },
                        {
                            selector: 'node:selected',
                            style: {
                                'border-width': '3px',
                                'border-color': '#ff0000',
                            },
                        },
                        {
                            selector: 'edge:selected',
                            style: {
                                'line-color': '#ff0000',
                                'target-arrow-color': '#ff0000',
                            },
                        },
                    ],
                    layout: {
                        name: 'circle',
                        animate: false,
                    },
                });

            } catch (error) {
                console.error('Error fetching JSON data:', error);
            }
        };

        fetchData();
    }, [filename]);

    return <div id="cy" style={{ height: '665px', width: '100%' }} />;
};

export default GraphChart;
