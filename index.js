import express from "express";
import winston from "winston";
import gradesRouter from "./routes/grades.js";
import { promises as fs } from "fs";

const { readFile, writeFile } = fs;
const { combine, timestamp, label, printf } = winston.format;
const logFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

global.fileName = "./src/grades.json"
global.logger = winston.createLogger({
    level: "silly",
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: "./logs/grades-control-api.log" })
    ],
    format: combine(
        label({ label: "grades-control-api" }),
        timestamp(),
        logFormat
    )
})

const app = express();
app.use(express.json());

app.use("/grades", gradesRouter);

app.listen(3000, async () => {
    try {
        await readFile(global.fileName);
        logger.info("API Started");
    } catch {
        const initialJson = {
            nextId: 1,
            accounts: []
        }
        writeFile(global.fileName, JSON.stringify(initialJson)).then(() => {
            logger.info("API Started and file created!");
        }).catch((err) => {
            logger.error(err);
        });        
    }
    

})