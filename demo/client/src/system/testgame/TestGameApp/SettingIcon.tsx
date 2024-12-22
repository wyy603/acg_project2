import React, { useState, CSSProperties } from 'react';
import { SettingOutlined } from "@ant-design/icons";
import { Space, Input, Select, Button, Switch, Typography, Card} from "antd";
import { getPlayerName, setPlayerName, setPlayerSkin, getPlayerSkin } from '@/system/utils';
const { Title, Text } = Typography;
import { ClientConfig } from '@/system';
import './styles.css';

export function SettingIcon() {
    const [isHovered, setIsHovered] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [changingName, setChangingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [lowFPS, setLowFPS] = useState(ClientConfig.lowFPS);
    const [noShadow, setNoShadow] = useState(ClientConfig.noShadow);
    const [newSkin, setNewSkin] = useState('');

    const fontStyle: CSSProperties = {
        fontFamily: 'Courier, Luminari, PT Sans, Fira Code, Arial, sans-serif',
    };

    const divStyle: CSSProperties = {
        ...fontStyle,
        transform: 'scale(2)',
        backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)',
        padding: '10px',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
    };

    const buttonStyle: CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // 透明背景
        border: '1px solid rgba(255, 255, 255, 0.5)', // 边框
        padding: '2px 6px', // 缩小内边距
        borderRadius: '4px', // 圆角
        cursor: 'pointer',
        height: 'auto', // 自适应高度
        lineHeight: '1', // 紧凑行高
        ...fontStyle,
        fontSize: '12px',
    };

    const settingsStyle: CSSProperties = {
        ...fontStyle,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 235, 225, 0.8)',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '20px', 
        paddingRight: '20px',
        borderRadius: '10px',
        display: showSettings ? 'block' : 'none',
        zIndex: 1001,
    };

    const containerStyle: CSSProperties = {
        ...fontStyle,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '20px',
    };

    const handleLowFPSChange = (checked: boolean) => {
        setLowFPS(checked);
        ClientConfig.update_lowFPS(checked);
    };

    const handleNoShadowChange = (checked: boolean) => {
        setNoShadow(checked);
        ClientConfig.update_noShadow(checked);
    };

    document.addEventListener('keydown', (event) => {
        if(event.key === "Escape" && showSettings) setShowSettings(false);
    }, false);

    return (
        <>
            <div
                style={divStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setShowSettings(!showSettings)}
            >
                <SettingOutlined />
            </div>

            {showSettings && (
                <div style={settingsStyle}>
                <div style={{ marginBottom: '0px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={3} style={{ ...fontStyle, margin: 0, fontSize: '24px' }}>Settings</Title>
                        <Button 
                            onClick={() => setShowSettings(false)} 
                            style={{ 
                                border: 'none', 
                                background: 'transparent', 
                                padding: 0, 
                                width: '20px', 
                                height: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center'
                            }}
                        >
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: '#F44336',
                                    borderRadius: '50%',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E57373'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F44336'}
                            />
                        </Button>
                    </div>
                    </div>

                    <div style={{ ...containerStyle, marginBottom: '8px', alignItems: 'center' }}>
                        <Text strong style={{ ...fontStyle, fontSize: '16px', margin: 0 }}>Name:</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}> 
                            {changingName ? (
                                <div style={{ marginBottom: '0px' }}>
                                    <Space>
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Enter new name"
                                            style={{ fontSize: '14px', ...fontStyle }}
                                        />
                                        <Button type="primary" onClick={() => { setPlayerName(newName); setChangingName(false); }} style={{ fontSize: '14px', ...fontStyle }}>
                                            Sure!
                                        </Button>
                                        <Button
                                            onClick={() => setChangingName(false)}
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                height: 'auto',
                                                lineHeight: '1',
                                                ...fontStyle
                                            }}
                                        >
                                            <Text strong style={{ ...fontStyle, fontSize: '14px' }}>Discard</Text>
                                        </Button>
                                    </Space>
                                </div>
                            ) : (
                                <div style={{ fontSize: '14px', ...fontStyle }}>
                                    {getPlayerName()}
                                </div>
                            )}
                        </div>
                        {!changingName && (
                            <Button
                                onClick={() => setChangingName(true)}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    height: 'auto',
                                    lineHeight: '1',
                                    ...fontStyle
                                }}
                            >
                                <Text strong style={{ ...fontStyle, fontSize: '14px' }}>Change Name</Text>
                            </Button>
                        )}
                    </div>
                    <div style={{ ...containerStyle, marginBottom: '10px', alignItems: 'center' }}> {/* 调整 alignItems 为 center */}
                        <Text strong style={{ ...fontStyle, fontSize: '16px', margin: 0 }}>skin:</Text> {/* 去掉 marginBottom */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Select
                                defaultValue={getPlayerSkin()}
                                dropdownStyle={{ backgroundColor: 'rgba(255, 235, 225, 1)',  }}
                                style={{
                                    width: 300,
                                    fontSize: '14px',
                                    ...fontStyle,
                                    backgroundColor: 'rgba(255, 255, 255, 0)', // 半透明背景
                                    border: '1px solid rgba(255, 255, 255, 0)', // 边框也设置为半透明
                                    borderRadius: '4px', // 圆角
                                    padding: '2px 6px', // 调整内边距
                                    margin: 0,
                                }}
                                onChange={(e) => setNewSkin(e)}
                                options={[
                                    { value: 'yuuka', label: 'yuuka' },
                                    { value: 'sneeze-box', label: 'sneeze-box' },
                                    { value: 'blockbench-default', label: 'blockbench-default' },
                                    { value: 'zombie', label: 'zombie' },
                                    { value: 'rainbow-creeper', label: 'rainbow-creeper' },
                                ]}
                            />
                            <Button type="primary" onClick={() => { if (newSkin !== '') setPlayerSkin(newSkin); }} style={{ fontSize: '14px', ...fontStyle }}>
                                Sure!
                            </Button>
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '5px' }}>
                        <Text strong style={{ ...fontStyle, fontSize: '16px' }}>low FPS: </Text>
                        <Switch checked={lowFPS} onChange={handleLowFPSChange} />
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <Text strong style={{ ...fontStyle, fontSize: '16px' }}>no shadow: </Text>
                        <Switch checked={noShadow} onChange={handleNoShadowChange} />
                    </div>
                </div>
            )}
        </>
    );
}
