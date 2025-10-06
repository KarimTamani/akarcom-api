import dotenv from 'dotenv';
dotenv.config();

interface Config {
    port : number ; 
    
    database : DatabaseConfig 
    JWT_SECRET: string ; 
    OAUTH_CLIENT_ID : string 
}

interface DatabaseConfig {
    type : string ; 
    uri : string ; 
}

 

const config : Config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 6060,
    database: {
        type: process.env.DATABASE_TYPE || 'postgres',
        uri: process.env.DATABASE_URI
    },
  
    JWT_SECRET  : process.env.JWT_SECRET , 
    OAUTH_CLIENT_ID : process.env.OAUTH_CLIENT_ID
};

export default config;
