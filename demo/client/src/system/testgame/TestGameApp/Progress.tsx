import React, { useState, useEffect, CSSProperties } from 'react'
import { Progress } from "antd";
import { HTMLSystem } from '../HTMLSystem'

function interpolateColor(value: number) {
    const startColor = [255, 0, 0]; // Red
    const endColor = [0, 255, 0];   // Green

    const ratio = value / 100;

    const color = startColor.map((start, index) => {
        return Math.round(start + ratio * (endColor[index] - start));
    });

    return `rgb(${color.join(',')})`;
}

function SingleProcess({ name, value }: { name: string, value: number }) {
    const color = value <= 40 ? "red" : (value <= 80 ? "yellow" : "green");
    return (
        <div key={name} style={{ marginBottom: '10px' }}>
            <span>{name}: {value}%</span>
            <Progress
                percent={value}
                percentPosition={{ align: 'start', type: 'inner' }}
                size={[300, 20]}
                strokeColor={interpolateColor(value)}
            />
        </div>
    );
}
  
export function ProgressApp() {
    const [progressList, setProgressList] = useState<Map<string, number> >(new Map());
    HTMLSystem.setSetter("Progress", setProgressList);
    const divStyle: CSSProperties = {
        position: "absolute",
        bottom: "40px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "1000",
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: '10px',
        borderRadius: '5px',
        height: '100px',
        width: '500px'
    };
    return <div style={divStyle}>
        {Object.entries(progressList).map(([key, value], i) => (
            <div key={i}>
                <SingleProcess name={key} value={value}/>
            </div>
        ))}
    </div>;
}