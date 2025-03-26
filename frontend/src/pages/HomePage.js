import React from 'react';
import { Button } from 'antd';
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// 导入 GIF
const gym1 = process.env.PUBLIC_URL + "/assets/gym1.gif";

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.container}>
            {/* 中间的 WELCOME & 按钮框 */}
            <div style={styles.box}>
                {/* gym1 在 WELCOME 前面 */}
                <div style={styles.titleContainer}>
                    <img src={gym1} alt="Small Gym Animation" style={styles.smallGif} />
                    <h1 style={styles.title}>WELCOME</h1>
                </div>

                {/* Sign In & Sign Up 按钮 */}
                <div style={styles.buttonContainer}>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<LoginOutlined />} 
                        style={styles.primaryButton} 
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>

                    <Button 
                        type="default" 
                        size="large" 
                        icon={<UserAddOutlined />} 
                        style={styles.secondaryButton} 
                        onClick={() => navigate('/register')}
                    >
                        Sign Up
                    </Button>
                </div>
            </div>

            {/* WELCOME 动态渐变动画 */}
            <style>
                {`
                    @keyframes welcomeGradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}
            </style>
        </div>
    );
};

// 样式表
const styles = {
    container: {
        textAlign: 'center',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(to right, #3f78d1, #67a8ff, #a3d8ff)', // 调整后的柔和蓝色渐变
    },
    box: {
        background: 'rgba(255, 255, 255, 0.6)',
        padding: '50px 60px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)', 
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row-reverse', // 让 gym1 在左，WELCOME 在右
        gap: '20px', // 让 GIF 和 WELCOME 之间有适当间距
    },
    title: {
        fontSize: '90px', // 放大
        fontFamily: "'Dancing Script', cursive",
        fontWeight: '900', // 加粗
        background: 'linear-gradient(45deg, #4178ff, #5dc2ff, #ffa500)',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        animation: 'welcomeGradient 4s ease infinite',
        backgroundSize: '400% 400%',
    },
    smallGif: {
        height: '80px', // 调整 GIF 大小，适配 WELCOME
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '280px',
    },
    primaryButton: {
        width: '100%',
        fontSize: '20px',
        fontWeight: 'bold',
        fontFamily: "'Montserrat', sans-serif",
        backgroundColor: '#1976D2',
        border: 'none',
        padding: '12px 0',
    },
    secondaryButton: {
        width: '100%',
        fontSize: '20px',
        fontWeight: 'bold',
        fontFamily: "'Montserrat', sans-serif",
        backgroundColor: 'transparent',
        border: '2px solid #1976D2',
        color: '#1976D2',
        padding: '12px 0',
    },
};

export default HomePage;
