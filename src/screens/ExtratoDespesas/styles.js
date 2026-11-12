import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 40, 
    backgroundColor: '#F8FAFC' 
  },
  titulo: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    marginBottom: 10 
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  desc: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  cat: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 4 
  },
  direita: { 
    alignItems: 'flex-end' 
  },
  val: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B' 
  },
  paga: { 
    fontSize: 12, 
    color: '#16A34A', 
    fontWeight: 'bold', 
    marginTop: 4 
  },
  pendente: { 
    fontSize: 12, 
    color: '#DC2626', 
    fontWeight: 'bold', 
    marginTop: 4 
  },
});

export { styles };