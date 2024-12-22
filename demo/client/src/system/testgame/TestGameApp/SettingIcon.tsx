import React, { useState, CSSProperties } from 'react';
import { SettingOutlined } from "@ant-design/icons";
import { Space, Input, Select, Button, Switch, Typography} from "antd";
import { getPlayerName, setPlayerName, setPlayerSkin, getPlayerSkin } from '@/system/utils';
const { Title, Text } = Typography;
import { ClientConfig } from '@/system';

export function SettingIcon() {
    const [isHovered, setIsHovered] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [changingName, setChangingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [lowFPS, setLowFPS] = useState(ClientConfig.lowFPS);
    const [noShadow, setNoShadow] = useState(ClientConfig.noShadow);
    const [newSkin, setNewSkin] = useState('');

    const divStyle: CSSProperties = {
        transform: 'scale(2)',
        backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)',
        padding: '10px',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
    };

    const settingsStyle: CSSProperties = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: '20px',
        borderRadius: '10px',
        display: showSettings ? 'block' : 'none',
        zIndex: 1001,
    };

    const containerStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
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

	document.addEventListener('keydown', () => {
        if(showSettings) setShowSettings(false);
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
                    <Title level={3}>Settings</Title>
                    <div style={containerStyle}>
                        <Text strong>Name:</Text>
                        <div>
                            {changingName ? (
                                <Space>
                                    <Input 
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Enter new name"
                                    />
                                    <Button onClick={() => {setPlayerName(newName), setChangingName(false);}}>Sure!</Button>
                                    <Button onClick={() => setChangingName(false)}>Discard</Button>
                                </Space>
                            ) : (
                                <div>
                                    {getPlayerName()}
                                </div>
                            )}
                        </div>
                        {!changingName && (
                            <Button onClick={() => setChangingName(true)}>
                                Change Name
                            </Button>
                        )}
                    </div>
                    <div>
                        <Text strong>Low FPS Mode:</Text>
                        <Switch checked={lowFPS} onChange={handleLowFPSChange} />
                    </div>
                    <div>
                        <Text strong>No Shadow:</Text>
                        <Switch checked={noShadow} onChange={handleNoShadowChange} />
                    </div>
                    <div style={containerStyle}>
                        <h3>Skin: </h3>
                        <div>
                            <Select
                                defaultValue={getPlayerSkin()}
                                style={{
                                    width: 300,
                                }}
                                onChange={(e) => setNewSkin(e)}
                                options={[
                                    {value: 'yuuka', label: 'yuuka',},
                                    {value: 'sneeze-box', label: 'sneeze-box',},
                                    {value: 'blockbench-default', label: 'blockbench-default',},
                                    {value: 'zombie', label: 'zombie',},
                                    {value: 'rainbow-creeper', label: 'rainbow-creeper',},
                                ]}
                            />
                            <Button onClick={() => {if(newSkin != '') setPlayerSkin(newSkin)}}>Sure!</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}