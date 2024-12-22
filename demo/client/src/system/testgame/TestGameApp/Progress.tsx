import React, { useState, useEffect, CSSProperties } from 'react'
import { Progress } from "antd";
import { HTMLSystem } from '../HTMLSystem'

function interpolateColor(value: number) {
    const startColor = [204, 244, 206]; // White
    const endColor = [0, 144, 0];   // Green

    const ratio = value / 100;

    const color = startColor.map((start, index) => {
        return Math.round(start + ratio * (endColor[index] - start));
    });

    return `rgb(${color.join(',')})`;
}

function SingleProcess({ name, value }: { name: string, value: number }) {
    return (
        <div key={name} style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 235, 225, 0.6)',
        padding: '10px',
        borderRadius: '25px',
        height: 'auto',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };
    return <div style={divStyle}>
        {Object.entries(progressList).map(([key, value], i) => (
            <div key={i}>
                <SingleProcess name={key} value={value}/>
            </div>
        ))}
    </div>;
}