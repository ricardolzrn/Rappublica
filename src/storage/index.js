import AsyncStorage from "@react-native-async-storage/async-storage";
export async function read(key) {
  const value = await AsyncStorage.getItem(`@rappublica/v1/${key}`);
  return value ? JSON.parse(value) : null;
}
export async function write(key, value) {
  await AsyncStorage.setItem(`@rappublica/v1/${key}`, JSON.stringify(value));
}
export async function remove(key) {
  await AsyncStorage.removeItem(`@rappublica/v1/${key}`);
}
