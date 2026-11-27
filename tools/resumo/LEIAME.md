# Resumo diário por e-mail (UNIcidade)

1. Dados: `GET https://cvaomfmovjqrafkfzatu.supabase.co/rest/v1/rpc/resumo_diario?p_chave=<CHAVE>&apikey=<PUBLISHABLE_KEY>`
   (função `resumo_diario` no banco; a chave fica dentro da função).
2. Clima: `GET https://api.open-meteo.com/v1/forecast?latitude=-21.6728&longitude=-43.2207&timezone=America%2FSao_Paulo&forecast_days=2&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum`
3. `python3 gerar.py dados.json clima.json "Helton" email.html` gera `email.html` (+ `email.txt`).
4. Enviar com as imagens inline: `logo.png` → `cid:att0`, `brasao.png` → `cid:att1`.
