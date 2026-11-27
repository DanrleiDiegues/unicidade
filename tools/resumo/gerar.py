# Template do e-mail diário no estilo UNIcidade usando só recursos que o Gmail respeita (tabelas + bgcolor, cores sólidas).
URL = 'https://unicidade.onrender.com'
BG, CARD, LINE, MUTED, INK, BLUE = '#e8eef6', '#ffffff', '#dbe4f0', '#64748b', '#0f172a', '#1D4ED8'

def card(inner, pad='14px 16px'):
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{CARD}" style="background-color:{CARD};border:1px solid {LINE};border-radius:16px"><tr><td style="padding:{pad}">{inner}</td></tr></table>'
def pill(txt, bg, fg):
    return f'<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle"><tr><td bgcolor="{bg}" style="background-color:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:10.5px;font-weight:bold;font-family:Arial,sans-serif">{txt}</td></tr></table>'
def button(txt, sub=None, big=True):
    sz, pd = ('20px', '18px 22px') if big else ('15px', '13px 26px')
    s = f'<br><span style="font-size:12.5px;color:#dbeafe;font-weight:normal">{sub}</span>' if sub else ''
    return (f'<table role="presentation" width="{"100%" if big else ""}" cellpadding="0" cellspacing="0" align="center"><tr>'
            f'<td bgcolor="{BLUE}" align="center" style="background-color:{BLUE};border-radius:16px;border-bottom:3px solid #1e3a8a">'
            f'<a href="{URL}" style="display:block;padding:{pd};color:#ffffff;text-decoration:none;font-size:{sz};font-weight:bold;font-family:Arial,sans-serif">{txt}{s}</a></td></tr></table>')
def section(icon, bg, title):
    return f'<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="{bg}" width="30" height="30" align="center" style="background-color:{bg};border-radius:8px;font-size:15px">{icon}</td><td style="padding-left:9px;font-size:17px;font-weight:bold;color:{INK}">{title}</td></tr></table>'
def kpi(label, val, sub, color):
    return f'<td width="25%" valign="top" style="padding:0 4px">{card(f"<div style=\'font-size:11.5px;color:{MUTED}\'>{label}</div><div style=\'font-size:26px;font-weight:bold;color:{color};line-height:1.25\'>{val}</div><div style=\'font-size:11px;color:{MUTED}\'>{sub}</div>", "12px")}</td>'
def bar(done, label):
    cells = ''.join(f'<td width="30" height="5" bgcolor="{BLUE if i < done else "#dbe3ee"}" style="background-color:{BLUE if i < done else "#dbe3ee"};border-radius:3px;font-size:0;line-height:0">&nbsp;</td><td width="4" style="font-size:0">&nbsp;</td>' for i in range(6))
    return f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:7px"><tr>{cells}<td style="padding-left:6px;font-size:11.5px;color:{BLUE}">{label}</td></tr></table>'

def build(d, modelo=False):
    rows = []
    if modelo:
        rows.append(f'<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fff7ed" style="background-color:#fff7ed;border:1px dashed #f59e0b;border-radius:12px;padding:9px 14px;font-size:12.5px;color:#7c2d12"><b>Modelo para sua aprovação.</b> Não foi enviado ao Helton. Dados reais de Chácara de hoje.</td></tr></table></td></tr>')
    head = (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
            f'<td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="cid:att0" width="38" height="38" alt="" style="display:block"></td>'
            f'<td style="padding-left:9px;font-family:Georgia,\'Times New Roman\',serif;font-size:23px;font-weight:bold;color:{INK}">UNIcidade</td></tr></table></td>'
            f'<td align="right" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color:#f8fafc;border:1px solid {LINE};border-radius:14px"><tr>'
            f'<td style="padding:6px 6px 6px 10px"><img src="cid:att1" width="40" alt="Brasão" style="display:block"></td>'
            f'<td style="padding:6px 12px 6px 4px;line-height:1.2"><span style="font-size:10.5px;color:{MUTED}">Prefeitura de</span><br><b style="font-size:14px;color:{INK}">{d["cidade"]}</b></td></tr></table></td></tr></table>')
    rows.append(f'<tr><td>{card(head, "14px 18px")}</td></tr>')
    rows.append(f'<tr><td style="padding-top:12px">{button("Abrir o UNIcidade agora →", f"Veja a frota, o mapa e as pendências de {d["cidade"]}")}</td></tr>')
    rows.append(f'<tr><td style="padding:22px 6px 14px"><div style="font-size:11px;letter-spacing:2px;color:{MUTED};text-transform:uppercase">Resumo diário · {d["data"]}</div>'
                f'<div style="font-size:30px;font-weight:bold;color:{INK};margin-top:4px">{d["saudacao"]}, {d["nome"]} <span style="font-weight:normal;color:#94a3b8">· visão da cidade</span></div></td></tr>')
    w = d['clima']
    clima = (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="56" style="font-size:40px">{w["ico"]}</td>'
             f'<td><div style="font-size:26px;font-weight:bold;color:{INK}">{w["min"]}° a {w["max"]}°C</div><div style="font-size:13px;color:{MUTED}">Hoje em {d["cidade"]} · {w["txt"]} · chuva {w["prob"]}%</div></td>'
             f'<td align="right"><table role="presentation" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="background-color:#f1f5f9;border-radius:12px"><tr><td align="center" style="padding:8px 12px;font-size:12px;color:{MUTED}">Amanhã<br><span style="font-size:18px">{w["ico2"]}</span><br><b style="color:{INK};font-size:14px">{w["max2"]}°</b> {w["min2"]}°<br><span style="color:#2563eb">💧{w["prob2"]}%</span></td></tr></table></td></tr></table>')
    if w.get('alerta'):
        clima += f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr><td bgcolor="#fef3c7" style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:8px 12px;font-size:12.5px;color:#78350f">⚠️ {w["alerta"]}</td></tr></table>'
    rows.append(f'<tr><td>{card(clima, "16px 18px")}</td></tr>')
    f = d['frota']
    rows.append(f'<tr><td style="padding:22px 6px 10px">{section("🚚", "#dbeafe", "UNIfrotas")}</td></tr>')
    rows.append('<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + kpi('Frota', f['total'], 'veículos', INK) + kpi('Disponíveis', f['disp'], 'prontos para sair', '#16a34a') + kpi('Em uso', f['uso'], 'agora', '#0891b2') + kpi('Manutenção', f['manut'], 'na oficina', '#ea580c') + '</tr></table></td></tr>')
    for u in f['em_uso']:
        inner = (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="42"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#cffafe" width="34" height="34" align="center" style="background-color:#cffafe;border-radius:17px;font-size:16px">🚗</td></tr></table></td>'
                 f'<td style="font-size:13.5px;color:{INK}"><b>{u["veiculo"]}</b><br><span style="color:{MUTED}">{u["detalhe"]}</span></td><td align="right">{pill("EM USO", "#cffafe", "#0e7490")}</td></tr></table>')
        rows.append(f'<tr><td style="padding-top:10px">{card(inner, "12px 14px")}</td></tr>')
    os_html = f'<div style="font-size:14px;font-weight:bold;color:{INK};margin-bottom:4px">Ordens de serviço abertas · {len(f["os"])}</div>'
    for o in f['os']:
        bg, fg = {'alta': ('#fee2e2', '#b91c1c'), 'media': ('#ffedd5', '#c2410c'), 'baixa': ('#dcfce7', '#15803d')}[o['prio']]
        os_html += (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px 0;border-top:1px solid #e2e8f0;font-size:13px;color:{INK}">'
                    f'{pill(o["prio"].upper(), bg, fg)}&nbsp; <b>{o["titulo"]}</b><div style="color:{MUTED};margin-top:3px">{o["detalhe"]}</div>{bar(o["etapa"] + 1, o["etapa_nome"])}</td></tr></table>')
    if f.get('concluidas'):
        os_html += f'<div style="font-size:12px;color:#16a34a;margin-top:4px">✓ {f["concluidas"]} OS concluída(s) este mês</div>'
    rows.append(f'<tr><td style="padding-top:10px">{card(os_html)}</td></tr>')
    rows.append(f'<tr><td style="padding:22px 6px 10px">{section("✅", "#dcfce7", "Para hoje")}</td></tr>')
    todo = ''.join(f'<tr><td width="30" valign="top" style="padding:10px 0;font-size:16px;{"border-top:1px solid #e2e8f0;" if i else ""}">{ic}</td><td style="padding:10px 0;font-size:13.5px;color:#334155;{"border-top:1px solid #e2e8f0;" if i else ""}">{t}</td></tr>' for i, (ic, t) in enumerate(d['todo']))
    rows.append(f'<tr><td>{card(f"<table role=\'presentation\' width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'>{todo}</table>", "4px 16px")}</td></tr>')
    rows.append(f'<tr><td align="center" style="padding:24px 6px 8px">{button("Abrir o UNIcidade →", big=False)}'
                f'<div style="font-size:12.5px;color:{MUTED};margin-top:12px">Viu algo para melhorar? Use o botão <b style="color:#713f12">💡 Sugerir melhoria</b> no topo do sistema.</div></td></tr>')
    rows.append(f'<tr><td align="center" style="padding:18px 20px 4px;font-size:11px;color:#94a3b8;line-height:1.5"><span style="font-family:Georgia,serif;font-weight:bold;color:{MUTED}">UNIcidade</span> · A prefeitura inteira, em um só lugar.<br>'
                f'Você recebe este resumo porque tem acesso de gestão ao UNIcidade de {d["cidade"]}. Ele chega todos os dias de manhã.</td></tr>')
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{BG}" style="background-color:{BG};font-family:\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:{INK}">'
            f'<tr><td align="center" style="padding:26px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">{"".join(rows)}</table></td></tr></table>')


# ---------- dados brutos (resumo_diario + Open-Meteo) -> e-mail ----------
import json, sys, datetime
DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
WMO = [((0,), 'céu limpo', '☀️'), ((1,), 'poucas nuvens', '🌤️'), ((2,), 'parcialmente nublado', '⛅'), ((3,), 'nublado', '☁️'), ((45, 48), 'neblina', '🌫️'),
       ((51, 53, 55, 56, 57), 'garoa', '🌦️'), ((61, 63, 66, 80, 81), 'chuva', '🌧️'), ((65, 67, 82), 'chuva forte', '🌧️'), ((95, 96, 99), 'tempestade', '⛈️')]
def tempo(c):
    for cs, t, i in WMO:
        if c in cs: return t, i
    return '—', '🌡️'

def montar(r, w, nome, hoje):
    dw = w['daily']
    t0, i0 = tempo(dw['weather_code'][0]); _, i1 = tempo(dw['weather_code'][1])
    alerta = None
    for k, quando in ((0, 'hoje'), (1, 'amanhã')):
        if dw['precipitation_probability_max'][k] >= 70 and dw['precipitation_sum'][k] >= 5:
            alerta = f'Chuva prevista para {quando} (cerca de {round(dw["precipitation_sum"][k])} mm). Atenção às estradas rurais, aos ônibus escolares e às máquinas.'; break
    em_uso = [{'veiculo': f'{u["modelo"].title() if u["modelo"].isupper() else u["modelo"]} · {u["placa"]}',
               'detalhe': f'Com {u["motorista"] or "motorista não informado"} · saiu em {u["saida"]} e ainda não voltou'} for u in r['em_uso']]
    os_ = [{'prio': o['prio'] if o['prio'] in ('alta', 'media', 'baixa') else 'media', 'titulo': o['titulo'],
            'detalhe': f'{o["placa"]} · {o["veiculo"]} · aberta há {o["dias"]} dia{"s" if o["dias"] != 1 else ""}', 'etapa': o['etapa'], 'etapa_nome': o['etapa_nome']} for o in r['os']]
    todo = []
    for o in r['os']:
        if o['prio'] == 'alta': todo.append(('🔴', f'A OS <b>{o["placa"]}</b> ({o["titulo"].lower()}) é de prioridade alta e está na etapa {o["etapa_nome"]} há {o["dias"]} dia(s).'))
    if float(r['combustivel_mes']) == 0: todo.append(('⛽', f'Nenhum abastecimento lançado em {MESES[hoje.month - 1]}. Lance as notas para acompanhar o gasto.'))
    if r['cnh_vencendo']: todo.append(('🪪', f'<b>{r["cnh_vencendo"]}</b> CNH(s) vencida(s) ou vencendo em 60 dias. Confira na aba Funcionários.'))
    if r['sem_cargo']: todo.append(('👥', f'<b>{r["sem_cargo"]} de {r["funcionarios"]}</b> funcionários sem cargo. Complete para ativar o alerta de CNH dos motoristas.'))
    if r.get('sugestoes_abertas'): todo.append(('💡', f'{r["sugestoes_abertas"]} sugestão(ões) de melhoria em andamento.'))
    if not todo: todo.append(('🎉', 'Nenhuma pendência hoje. Bom trabalho!'))
    h = hoje.hour
    return {'cidade': r['cidade'], 'nome': nome, 'saudacao': 'Bom dia' if h < 12 else ('Boa tarde' if h < 18 else 'Boa noite'),
            'data': f'{DIAS[hoje.weekday()]}, {hoje.day} de {MESES[hoje.month - 1]}',
            'clima': {'ico': i0, 'min': round(dw['temperature_2m_min'][0]), 'max': round(dw['temperature_2m_max'][0]), 'txt': t0, 'prob': dw['precipitation_probability_max'][0],
                      'ico2': i1, 'min2': round(dw['temperature_2m_min'][1]), 'max2': round(dw['temperature_2m_max'][1]), 'prob2': dw['precipitation_probability_max'][1], 'alerta': alerta},
            'frota': {'total': r['veiculos'], 'disp': r['disponivel'], 'uso': r['em_uso_n'], 'manut': r['manutencao'], 'concluidas': r['os_concluidas_mes'], 'em_uso': em_uso, 'os': os_},
            'todo': todo}

if __name__ == '__main__':
    # uso: python3 gerar.py dados.json clima.json "Helton" saida.html
    r = json.load(open(sys.argv[1])); w = json.load(open(sys.argv[2]))
    hoje = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3)))
    d = montar(r, w, sys.argv[3], hoje)
    html = build(d)
    open(sys.argv[4], 'w').write(html)
    open(sys.argv[4].replace('.html', '.txt'), 'w').write(f"{d['saudacao']}, {d['nome']}! Resumo de {d['cidade']} de {d['data']}. Frota: {r['veiculos']} veículos, {r['disponivel']} disponíveis, {r['em_uso_n']} em uso, {r['manutencao']} em manutenção. OS abertas: {len(r['os'])}. Abrir o UNIcidade: {URL}")
    print('ok', len(html), d['saudacao'], d['data'])
