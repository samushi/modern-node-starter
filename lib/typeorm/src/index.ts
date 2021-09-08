import express from 'express';
import dotenv from 'dotenv-safe';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const viewPath = process.env.VIEW_PATH || 'views';
const welcomeTitle = process.env.PROJECT_NAME || "Welcome";

app.set('views', path.join(__dirname, viewPath));
app.set('view engine', 'ejs');

app.get('/', (req, resp) => {
  resp.render('index', { title: welcomeTitle });
});

app.listen(port, () => {
  console.log(`Server started at http://${host}:${port}`);
});
