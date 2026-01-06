import Constants from 'expo-constants';

const getIPAddress = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];
    
    if (localhost) {
        return localhost;
    }
    return '127.0.0.1';
};

export default getIPAddress();
