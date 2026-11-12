module.exports = function register(app, store) {
  const { get, despesas, mes, moradores } = store;
  app.get("/api/resumo", (req, res) => {
    const month = mes(req.query.mes),
      lista = despesas(month);
    const totalCentavos = lista.reduce((s, d) => s + d.valorCentavos, 0),
      pendenteCentavos = lista.reduce((s, d) => s + d.pendenteCentavos, 0);
    res.json({
      republica: get("SELECT * FROM republica WHERE id=1"),
      mes: month,
      moradores: moradores().length,
      totalCentavos,
      pendenteCentavos,
      pagoCentavos: totalCentavos - pendenteCentavos,
      proximas: lista.filter((d) => !d.paga).slice(0, 4),
      quantidade: lista.length,
    });
  });
};
