import React, { useState, useEffect, CSSProperties } from 'react'
import { Progress } from "antd";
import { HTMLSystem } from '../HTMLSystem'
import * as C from '@/component'
import { Space, Input, Select, Button, Switch, Typography} from "antd";
import { sendPlayerMessage } from '@/system/utils'

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

export function Message({playerChat}: {playerChat: any}) {
    if(playerChat.type == 'message') {
        return (
            <div>
                <strong>{playerChat.name}:</strong>
                <span>{playerChat.str}</span>
            </div>
        )
    } else if(playerChat.type == 'error') {
        return (
            <div style={{color:"red"}}>
                <span>{playerChat.str}</span>
            </div>
        )
    } else if(playerChat.type == 'systemmessage') {
        return (
            <div style={{color:"green"}}>
                <span>{playerChat.str}</span>
            </div>
        )
    }
}
  
export function ChatBox() {
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    HTMLSystem.setSetter("ChatBox", setChatMessages);
    const outerBox: CSSProperties = {
        backgroundColor: 'rgba(207, 207, 231, 0.6)',
        padding: '10px',
        borderRadius: '5px',
        height: '400px',
        width: '300px'
    };
    const messageBox: CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        height: '90%',
        overflowY: 'auto',
        marginBottom: '10px'
    };

    const inputBox: CSSProperties = {
        height: '10%',
    };
    return <div style={outerBox}>
        <div style={messageBox}>
            {chatMessages.map((playerChat, index) => (
                <Message playerChat={playerChat} key={index}></Message>
            ))}
        </div>
        <div style={inputBox}>
            <Space>
                <Input 
                    value={newMessage}
                    style={{flexGrow: 1, marginRight: '10px'}}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && newMessage !== "") {
                            console.log("newMessage=", newMessage);
                            sendPlayerMessage(newMessage);
                            setNewMessage("");
                        }
                    }}
                    placeholder="Send new message"
                />
                <Button 
                    onClick={() => {sendPlayerMessage(newMessage), setNewMessage("");}}
                >
                    Send!
                </Button>
            </Space>
        </div>
    </div>;
}