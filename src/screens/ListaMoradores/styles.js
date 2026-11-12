import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: '#F8FAFC' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  info: { marginLeft: 15 },
  nome: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  detalhe: { fontSize: 13, color: '#64748B', marginTop: 2 },
});