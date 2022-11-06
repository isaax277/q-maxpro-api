const express = require('express')
const app = express()
const verificarToken = require("./verificarToken");
const cors = require("cors");
const port = process.env.PORT || 3000
const controller = require('./main_controller')
app.use("*", cors());
app.use(express.json({
    limit: "150mb",
  }))
app.use(express.urlencoded({ extended: true, limit: "150mb" }))

app.get('/', (res, req) => req.send('<h1>JEHOVA ES MI PASTOR; NADA ME FALTARA</h1>'));

//prestamos
app.post('/insertar_pg', verificarToken, controller.nuevo_pago);

app.get('/prestamos',verificarToken, controller.prestamos);
app.get('/prestamo/:id',verificarToken, controller.cuotas);
app.get('/recibos', verificarToken, controller.recibos);

//login
app.get('/me' , verificarToken, controller.me)
app.post('/l', controller.login)

app.listen(port, () => {
    console.log('App listen on port : ', port )
})

