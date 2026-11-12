import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  content: {
    padding: 20,
    paddingTop: 45,
  },
  headerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  nomeRepublica: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  badgeMoradores: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cardFinanceiro: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardDestaque: {
    backgroundColor: "#1E293B",
    borderColor: "#1E293B",
    marginRight: 0,
    marginLeft: 8,
  },
  labelCard: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  labelCardDestaque: {
    color: "#94A3B8",
  },
  valorCard: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  valorCardDestaque: {
    color: "#38BDF8",
  },
  detalheDivisao: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  gridAtalhos: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemGrid: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconeAtalho: {
    fontSize: 24,
    marginBottom: 8,
  },
  tituloAtalho: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  descAtalho: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});

export { styles };
