import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#FFFFFF",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 15,
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 10 },
  picker: { height: 50, backgroundColor: "#F1F5F9", marginVertical: 8 },
  rowSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
  },
  valorSlider: {
    fontSize: 16,
    textAlign: "center",
    color: "#0284C7",
    fontWeight: "bold",
  },
});
