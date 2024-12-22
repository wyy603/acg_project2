import React, { useState, useEffect, CSSProperties } from 'react'
import { HTMLSystem } from '../HTMLSystem'
import { ProgressApp } from './Progress'
import { SettingIcon } from './SettingIcon'
import { OvercraftInfo } from './OvercraftInfo'
import { ChatBox } from './ChatBox'

function Logger() {
    const [logger, setLogger] = useState("");
    HTMLSystem.setSetter("Logger", setLogger);
    const loggerStyle: CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: '10px',
        borderRadius: '5px',
        width: '500px',
        maxHeight: '300px',
        overflowY: 'auto',
        marginBottom: "10px",
    };
    return <div style={loggerStyle}>
        {Object.entries(logger).map(([key, value], index) => (
            <div key={index}>
                <strong>{key}: </strong>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
            </div>
        ))}
    </div>
}
export function TestGameApp() {
    const leftTop: CSSProperties = {
        position: "absolute",
        top: "60px",
        left: "20px",
        zIndex: 1000,
    }
    const rightTop: CSSProperties = {
        position: "absolute",
        top: "40px",
        right: "40px",
        zIndex: 1000,
    }
    const rightBottom: CSSProperties = {
        position: "absolute",
        bottom: "40px",
        right: "40px",
        zIndex: 1000,
    }
    return (
        <div>
            <div style={leftTop}>
                <OvercraftInfo/>
                <Logger/>
            </div>
            <ProgressApp/>
            <div style={rightTop}>
                <SettingIcon/>
            </div>
            <div style={rightBottom}>
                <ChatBox/>
            </div>
        </div>
    );
}