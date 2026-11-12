import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    backgroundColor: "#F8FAFC",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 15,
  },
  subtituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 12,
  },
  boxFormAdicionar: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardRegra: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tituloRegra: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0284C7",
  },
  textoRegra: {
    fontSize: 14,
    color: "#334155",
    marginTop: 4,
    lineHeight: 20,
  },
  rowAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  txtAcaoEditar: {
    color: "#0284C7",
    fontWeight: "bold",
    fontSize: 13,
    marginRight: 16,
  },
  txtAcaoExcluir: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 13,
  },
  rowAcoesEdicao: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  btnSalvar: {
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginRight: 8,
  },
  btnCancelar: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  txtBtnBranco: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  txtBtnCinza: {
    color: "#475569",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardAdesao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nomeMorador: {
    fontWeight: "600",
    color: "#334155",
  },
  statusAdesao: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 2,
  },
});

export { styles };
