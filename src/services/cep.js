export async function consultarCep(input) {
  const cep = input.replace(/\D/g, "");
  if (cep.length !== 8) throw new Error("Digite um CEP com 8 números.");
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.erro) throw new Error("CEP não encontrado.");
    return {
      cep,
      endereco: [
        data.logradouro,
        data.bairro,
        `${data.localidade} - ${data.uf}`,
      ]
        .filter(Boolean)
        .join(", "),
    };
  } catch (e) {
    if (e.message === "CEP não encontrado.") throw e;
    throw new Error(
      "Não foi possível consultar o ViaCEP. Você pode preencher o endereço manualmente.",
    );
  } finally {
    clearTimeout(timer);
  }
}
