const pool = require('./db');
const jwt = require("jsonwebtoken");

exports.nuevo_pago = (req, res) => {

    jwt.verify(req.token, "F0rever06", async (err, result) => {
        if (err) req.sendStatus(403);
        else {

            const prestamo_id = req.body.Id;
            const monto = req.body.Monto;
            
            const tipo_prestamo = await pool.query(`select Amortizable from pr_prestamos where Id = ${ prestamo_id }`)
            
            if (tipo_prestamo.recordset[0].Amortizable == true) await pool.query(`exec proc_aplicar_pago_amortizable ${ prestamo_id }, ${ monto }, 0`)
            else await pool.query(`exec proc_aplicar_pago_simple ${ prestamo_id }, ${ monto }, 0`)

            const result_recibo = await pool.query(`select max(id) as Id from cj_recibos`)
            const id_recibo = result_recibo.recordset[0].Id
                
            const recibo = await pool.query(`
            select 
                t.id, t.CuotaPago as cuota_pago, c.Nombre as nombrecliente, 
                c.apodo, t.Fecha as fecha_pago, t.Monto as monto_pago, 
                p.MontoPrestamo as monto_prestado, t.Balance  as balance_pago
            from 
                cj_recibos t 
          join 
                pr_prestamos p on p.Id = t.PrestamoId 
          join 
                cl_clientes c on c.Id = p.ClienteID
          where 
                t.id = ${ id_recibo }`)

                res.status(200).json(recibo.recordset[0])

        }
    })
}

exports.prestamos = async (req, res) => {
    jwt.verify(req.token, "F0rever06", async (err, result) => {
        if (err) res.sendStatus(403);
        else {

            let query = `select
            c.Nombre as nombrecliente, c.apodo, p.Tipoprestamo as tipo_prestamo, p.balancegeneral as balance, 
            c.identificacion, p.id as prestamos_id, c.direccion, c.lugartrabjo as lugar_trabajo, c.telefono1, c.telefono2, 
            p.montoprestamo as monto_prestado, p.cantidadcuotas as cantidad_cuotas, p.montocuota as valor_cuota
        from
            pr_prestamos p 
        join 
            cl_clientes c on c.Id = p.ClienteID
        where
            p.activo = 1
        and
            p.cobradorID = ${result.data.Id}
        `
            //si tenemos query buscamos el prestamo
            if (req.query.nombre) query += ` and c.Nombre like '%${req.query.nombre}%'`

            const prestamos = await pool.query(query)

            res.status(200).json(prestamos.recordset)

        }
    });
}

exports.cuotas = async (req, res) => {
    jwt.verify(req.token, "F0rever06", async (err, result) => {
        if (err) res.sendStatus(403);
        else {
            const id = req.params.id

            const prestamo = await pool.query(`select
            c.Nombre as nombrecliente, c.apodo, p.Tipoprestamo as tipo_prestamo,  p.balancegeneral as balance, 
            c.identificacion, p.id as prestamos_id, c.direccion, c.lugartrabjo as lugar_trabajo, c.telefono1, c.telefono2, 
            p.montoprestamo as monto_prestado, p.cantidadcuotas as cantidad_cuotas, p.montocuota as valor_cuota
        from
            pr_prestamos p 
        join 
            cl_clientes c on c.Id = p.ClienteID
        where
            p.Id = ${id}`)


            const cuotas = await pool.query(`select 
            Numero as numero_cuota, Fecha as fecha_cuota, Monto as monto_cuota, balancegeneral as balance_cuota 
            from 
                pr_cuotas 
            where 
                PrestamoId = ${id}
            and    
            Estado = 1`)
            res.status(200).json({
                cuotas: cuotas.recordset,
                prestamo: prestamo.recordset[0]
            })
        }
    });
}

exports.me = (req, res) => {
    jwt.verify(req.token, "F0rever06", (err, result) => {
        if (err) res.sendStatus(403);
        else res.status(200).send(result.data);
    });
};

exports.recibos = (req, res) => {
    jwt.verify(req.token, "F0rever06", async (err, result) => {
        if (err) res.sendStatus(403);
        else {
            pool.query(`
            select 
   t.id, t.CuotaPago as cuota_pago, c.Nombre as nombrecliente, 
    c.apodo, t.Fecha as fecha_pago, t.Monto as monto_pago, 
    p.MontoPrestamo as monto_prestado, t.Balance  as balance_pago
        from 
    cj_recibos t 
     join 
            pr_prestamos p on p.Id = t.PrestamoId 
      join 
            cl_clientes c on c.Id = p.ClienteID
      where 
            t.CobradorId = ${ result.data.Id } and cast(t.Fecha as date) = CAST( GETDATE() as DATE)`)
                .then((result) => res.status(200).json(result.recordset))
        }
    });
}

exports.login = async (req, res) => {

    const body = req.body
    const user = await pool.query(`select Id, Nombre, Telefono from pr_cobradores where nombre = '${body.user}' and Psw = HASHBYTES('md5', '${body.psw}')`)
    if (user.recordset.length == 0)
        res.sendStatus(404);
    else {
        const data = user.recordset[0]
        jwt.sign({ data }, 'F0rever06', (err, token) => {
            if (err) res.sendStatus(500);
            else res.status(200).json(token)
        });
    }

}



