import React, { useState, useEffect, CSSProperties } from 'react'
import { Progress } from "antd";
import { HTMLSystem } from '../HTMLSystem'
import { INGREDIENT, INGREDIENT_PROPERTY } from '@shared/constant'

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
            <Progress
                steps={3}
                showInfo={false}
                percent={value}
                style={{width:"100%"}}
                strokeColor={interpolateColor(value)}
            />
        </div>
    );
}
  
export function OvercraftInfo() {
    const [info, setInfo] = useState<Record<string, any> >({});
    HTMLSystem.setSetter("OvercraftInfo", setInfo);
    const divStyle1: CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: '10px',
        borderRadius: '5px',
        width: '500px',
        maxHeight: '300px',
        overflowY: 'auto',
        marginBottom: "10px",
        fontSize: "25px"
    };
    const divStyle2: CSSProperties = {
        display: "flex",
        fontSize: "20px"
    };
    const divStyle3: CSSProperties = {
        borderRadius: '10px',
        marginRight: "10px",
        overflow: 'hidden',
        minWidth: "70px",
    };
    return <div style={divStyle1}>
        <div>
            <strong>playerCatchType: </strong> {info.playerCatchType}
        </div>
        <div>
            <strong>Score: </strong> {info.score}
        </div>
        <div>
            <strong>Time: </strong> {info.time}
        </div>
        <div style={divStyle2}>
            {info.orderList && info.orderList.map((order: any, index: number) => (
                <div key={index} style={divStyle3}>
                    <div style={{ backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: "30px" }}>
                        <SingleProcess name="tmp" value={order.percentage}></SingleProcess>
                    </div>
                    <div style={{ display: "flex", backgroundColor: '#add8e6', }}>
                        {order.ingredients && order.tutorial.map((ingredient: INGREDIENT, index: number) => (
                            INGREDIENT_PROPERTY[ingredient].icon && (
                                <div key={index}>
                                    <img
                                        src={INGREDIENT_PROPERTY[ingredient].icon}
                                        alt={INGREDIENT_PROPERTY[ingredient].name}
                                        style={{ width: '30px', height: '30px', borderRadius: '50%', marginTop: "10px", marginBottom: "10px", marginLeft: "10px" }}
                                    />
                                </div>
                            )
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
}