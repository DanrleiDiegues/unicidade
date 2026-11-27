# News UNIcidade: compilado de notícias da região (resumos próprios + link para a fonte), no estilo da plataforma.
import json, sys
src = open(__file__.replace('news.py', 'gerar.py')).read().split('# ---------- dados brutos')[0]
exec(src)  # card, pill, button, section, cores

def item(n):
    return card(
        f'<div style="font-size:11px;letter-spacing:1px;color:{MUTED};text-transform:uppercase">{n["local"]} · {n["data"]}</div>'
        f'<div style="font-size:16.5px;font-weight:bold;color:{INK};margin:4px 0 6px;line-height:1.3">{n["titulo"]}</div>'
        f'<div style="font-size:13.5px;color:#334155;line-height:1.55">{n["resumo"]}</div>'
        f'<div style="margin-top:9px;font-size:12.5px"><a href="{n["url"]}" style="color:{BLUE};text-decoration:none;font-weight:bold">Ler na fonte: {n["fonte"]} →</a></div>', '14px 16px')

def cta(titulo, texto, botao):
    inner = (f'<div style="font-size:17px;font-weight:bold;color:#ffffff">{titulo}</div>'
             f'<div style="font-size:13.5px;color:#dbeafe;margin:6px 0 12px;line-height:1.5">{texto}</div>'
             f'<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:12px">'
             f'<a href="{URL}" style="display:block;padding:11px 20px;color:{BLUE};text-decoration:none;font-weight:bold;font-size:14.5px;font-family:Arial,sans-serif">{botao}</a></td></tr></table>')
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="{BLUE}" style="background-color:{BLUE};border-radius:18px;padding:20px 22px">{inner}</td></tr></table>'

def news(ed, modelo=False):
    rows = []
    if modelo:
        rows.append(f'<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#fff7ed" style="background-color:#fff7ed;border:1px dashed #f59e0b;border-radius:12px;padding:9px 14px;font-size:12.5px;color:#7c2d12"><b>Modelo para sua aprovação.</b> Ainda não foi enviado ao Helton.</td></tr></table></td></tr>')
    head = (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="cid:att0" width="38" height="38" alt="" style="display:block"></td>'
            f'<td style="padding-left:9px"><div style="font-family:Georgia,\'Times New Roman\',serif;font-size:23px;font-weight:bold;color:{INK};line-height:1.1">News UNIcidade</div>'
            f'<div style="font-size:12px;color:{MUTED}">Notícias de {ed["regiao"]}</div></td></tr></table></td>'
            f'<td align="right" valign="middle" style="font-size:11.5px;color:{MUTED};line-height:1.4">{ed["data"]}<br><b style="color:{INK}">Edição nº {ed["numero"]}</b></td></tr></table>')
    rows.append(f'<tr><td>{card(head, "14px 18px")}</td></tr>')
    rows.append(f'<tr><td style="padding:14px 6px 4px;font-size:13.5px;color:#334155;line-height:1.55">Olá, {ed["nome"]}! Este é um <b>compilado das principais notícias de {ed["regiao"]}</b>, publicadas por jornais e portais da região. '
                f'A seleção e os resumos são feitos pela <b>UNIcidade</b>; para ler cada matéria completa, clique no link da fonte.</td></tr>')
    for sec in ed['secoes']:
        rows.append(f'<tr><td style="padding:18px 6px 10px">{section(sec["icone"], sec["cor"], sec["titulo"])}</td></tr>')
        for n in sec['itens']:
            rows.append(f'<tr><td style="padding-bottom:10px">{item(n)}</td></tr>')
        if sec.get('cta'):
            c = sec['cta']; rows.append(f'<tr><td style="padding:10px 0 4px">{cta(c[0], c[1], c[2])}</td></tr>')
    f = ed['cta_final']
    rows.append(f'<tr><td style="padding:20px 0 4px">{cta(f[0], f[1], f[2])}</td></tr>')
    rows.append(f'<tr><td align="center" style="padding:20px 20px 4px;font-size:11px;color:#94a3b8;line-height:1.6">'
                f'<span style="font-family:Georgia,serif;font-weight:bold;color:{MUTED}">News UNIcidade</span> · segundas, quartas e sextas<br>'
                f'Compilado de notícias de veículos de imprensa, com seleção e resumos feitos pela UNIcidade. Os direitos de cada matéria pertencem ao respectivo veículo, '
                f'e a UNIcidade não tem vínculo com eles.<br>UNIcidade · A prefeitura inteira, em um só lugar.</td></tr>')
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{BG}" style="background-color:{BG};font-family:\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:{INK}">'
            f'<tr><td align="center" style="padding:26px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">{"".join(rows)}</table></td></tr></table>')

if __name__ == '__main__':
    # uso: python3 news.py edicao.json saida.html [--modelo]
    ed = json.load(open(sys.argv[1]))
    open(sys.argv[2], 'w').write(news(ed, '--modelo' in sys.argv))
    print('ok')
