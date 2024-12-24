import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { Space, Input, Button } from "antd";
import { HTMLSystem } from '../HTMLSystem';
import { sendPlayerMessage } from '@/system/utils';
import Draggable from 'react-draggable';

export function Message({ playerChat }: { playerChat: any }) {
    const baseStyle: CSSProperties = {
        transition: 'opacity 0.3s ease',
        opacity: playerChat.isFocused ? 1 : 0.1,
    };

    if (playerChat.type === 'message') {
        return (
            <div style={baseStyle}>
                <strong>{playerChat.name}:</strong>
                <span>{playerChat.str}</span>
            </div>
        );
    } else if (playerChat.type === 'error') {
        return (
            <div style={{ ...baseStyle, color: "red" }}>
                <span>{playerChat.str}</span>
            </div>
        );
    } else if (playerChat.type === 'systemmessage') {
        playerChat.setIsFocused(true);
        // console.log("Set is focused for message", playerChat);
        // playerChat.setIsFocused(false);
        // playerChaat
        // setTimeout(() => {
        //     console.log
        //     playerChat.setIsFocused(false);
        // }, 3000); // 例如，3秒后取消聚焦
        return (
            <div style={{ ...baseStyle, color: "green" }}>
                <span>{playerChat.str}</span>
            </div>
        );
    }
}

export function ChatBox() {
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const messageEndRef = useRef<HTMLDivElement | null>(null);

    HTMLSystem.setSetter("ChatBox", setChatMessages);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const outerBox: CSSProperties = {
        position: 'fixed',
        bottom: '180px',
        right: '20px',
        backgroundColor: isFocused ? 'rgba(207, 207, 231, 0.9)' : 'rgba(207, 207, 231, 0.05)',
        padding: '10px',
        borderRadius: '5px',
        height: '300px',
        width: '250px',
        transition: 'background-color 0.3s ease',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    };

    const messageBox: CSSProperties = {
        backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)',
        height: '85%',
        overflowY: 'auto',
        marginBottom: '10px',
        transition: 'background-color 0.3s ease',
    };

    const inputBox: CSSProperties = {
        height: '15%',
        opacity: isFocused ? 1 : 0.1,
        transition: 'opacity 0.3s ease',
    };

    return (
        <Draggable>
            <div style={outerBox}>
                <div style={messageBox}>
                    {chatMessages.map((playerChat, index) => (
                        <Message playerChat={{ ...playerChat, isFocused, setIsFocused }} key={index} />
                    ))}
                    <div ref={messageEndRef} />
                </div>
                <div style={inputBox}>
                    <Space>
                        <Input
                            value={newMessage}
                            style={{ flexGrow: 1, marginRight: '10px'}}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && newMessage !== "") {
                                    sendPlayerMessage(newMessage);
                                    setNewMessage("");
                                }
                            }}
                            placeholder="Send new message"
                        />
                        <Button
                            onClick={() => {
                                if (newMessage !== "") {
                                    sendPlayerMessage(newMessage);
                                    setNewMessage("");
                                }
                            }}
                        >
                            Send
                        </Button>
                    </Space>
                </div>
            </div>
        </Draggable>
    );
}