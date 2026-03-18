const API_KEY = "AIzaSyAN_99JGuTrpDDovOV-gNYnuULq2Nqjnuc";

async function listModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  const data = await response.json();
  const names = data.models.map(m => m.name);
  console.log(names.join('\n'));
}

listModels();
