#!/usr/bin/env python3

# -*- coding: utf-8 -*-
import sys
#from config import *
#conn = psycopg2.connect(cstring)

import progressbar
#bar = progressbar.ProgressBar(maxval=total, widgets=[progressbar.Bar('=', '[', ']'), ' ',progressbar.ETA(),' ', progressbar.Percentage()])
#bar.start()	
#_ibar=0
#bar.update(_ibar);_ibar+=1
#bar.finish()

import re, requests, getpass, csv, json, uuid, glob, os
from dateutil import parser
from dateutil.tz import gettz
import pytz #,ogr

from osgeo import ogr, gdal

driver = ogr.GetDriverByName('ESRI Shapefile')
distritos_dataset = driver.Open("sp/distritos.shp", 0)
distritos = distritos_dataset.GetLayer()
subs_dataset = driver.Open("sp/subprefeituras.shp", 0)
subs = subs_dataset.GetLayer()

import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
import carrega_csv
from utils import extract, _add_local_id, create_schema

if len(sys.argv)>1:
    carrega_csv.directory = sys.argv[1]#'SAT2019'
else:
    d=input("Location: [~/sat]")
    if d=="":
        d="%s/sat" % (os.path.expanduser('~'))
    carrega_csv.directory=d

if len(sys.argv)>1:
    url = sys.argv[2]#"https://vidasegura.cetsp.com.br"
else:
    url=input("url: [http://192.168.1.101:8000]")
    if url=="":
        url="http://192.168.1.101:8000"
print(url)
written='written'
if len(sys.argv)>3:
    written=sys.argv[3]
veiculos=carrega_csv.loadveiculos()
vitimas=carrega_csv.loadvitimas()

existent=[]
if os.path.exists("sp/%s"%(written)):
    with open("sp/%s"%(written)) as f:
        existent = f.read().splitlines()

tz1 = gettz('America/Sao_Paulo')

SEXOS={
    "M":"Masculino","F":"Feminino"
}

TIPOS_COLISAO={
    "CO":"Colisão",
    "CF":"Colisão frontal",
    "CT":"Colisão traseira",
    "CL":"Colisão lateral",
    "CV":"Colisão transversal",
    "CP":"Capotamento",
    "TB":"Tombamento",
    "AT":"Atropelamento",
    "AA":"Atropelamento de animal",
    "CH":"Choque",
    "QM":"Queda moto",
    "QB":"Queda bicicleta",
    "QV":"Queda veículo",
    "QD":"Queda ocupante dentro",
    "QF":"Queda ocupante fora",
    "OU":"Outros",
    "SI":"Sem informações",
    "Choque":"Choque",
    "Colisão transversal":"Colisão transversal",
    "Atropelamento":"Atropelamento",
    "Colisão lateral":"Colisão lateral",
    "Queda moto/bicicleta":"Queda moto/bicicleta",
    "Colisão traseira":"Colisão traseira",
    "Colisão":"Colisão",
    "Outros":"Outros",
    "Colisão frontal":"Colisão frontal",
    "Tombamento":"Tombamento",
    "Queda ocupante dentro":"Queda ocupante dentro",
    "Sem Informação":"Sem informações",
    "Capotamento":"Capotamento",
    "Queda ocupante fora":"Queda ocupante fora",
    "Atropelamento de animal":"Atropelamento de animal",
    "Queda veículo":"Queda veículo",
}
TIPOS_RESUMIDOS_COLISAO={
    "CO":"Colisão",
    "CF":"Colisão",
    "CT":"Colisão",
    "CL":"Colisão",
    "CV":"Colisão",
    "CP":"Capotamento",
    "TB":"Capotamento",
    "AT":"Atropelamento",
    "AA":"Atropelamento",
    "CH":"Choque",
    "QM":"Queda",
    "QB":"Queda",
    "QV":"Queda",
    "QD":"Queda",
    "QF":"Queda",
    "OU":"Outros",
    "SI":"Sem informações",
    "Choque": "Choque",
    "Colisão transversal": "Colisão",
    "Atropelamento": "Atropelamento",
    "Colisão lateral": "Colisão",
    "Queda moto/bicicleta": "Queda",
    "Colisão traseira": "Colisão",
    "Colisão": "Colisão",
    "Outros": "Outros",
    "Colisão frontal": "Colisão",
    "Tombamento": "Capotamento",
    "Queda ocupante dentro": "Queda",
    "Sem Informação": "Sem informações",
    "Capotamento": "Capotamento",
    "Queda ocupante fora": "Queda",
    "Atropelamento de animal": "Atropelamento",
    "Queda veículo": "Queda",
}


TIPOS_VEICULO={
    "AU":"Auto",
    "MO":"Moto",
    "ON":"Ônibus",
    "CA":"Caminhão",
    "BI":"Bicicleta",
    "MT":"Moto Táxi",
    "OF":"Ônibus Fretado/Intermunicipal",
    "OU":"Ônibus Urbano",
    "MC":"Microônibus",
    "VA":"Van",
    "VC":"Vuc",
    "CM":"Caminhonete/Camioneta",
    "CR":"Carreta",
    "JI":"Jipe",
    "OT":"Outros",
    "SI":"Sem Informação",
    "CO":"Carroça",
    "automóvel":"Auto",
    "moto":"Moto",
    "ônibus":"Ônibus",
    "caminhonete":"Caminhonete/Camioneta",
    "bicicleta":"Bicicleta",
    "caminhão":"Caminhão",
    "sem informação":"Sem Informação",
    "outro":"Outros",
    "van":"Van",
    "micro-ônibus":"Microônibus",
    "ônibus urbano":"Ônibus Urbano",
    "ônibus fretado": "Ônibus Fretado/Intermunicipal",
    "ônibus Fretado": "Ônibus Fretado/Intermunicipal",
    "carreta":"Outros",
    "carroça": "Carroça",
    "jipe":"Auto",
}
TIPOS_VEICULO_RESUMIDO={
    "AU":"Automóvel",
    "MO":"Motocicleta",
    "ON":"Ônibus",
    "CA":"Caminhão",
    "BI":"Bicicleta",
    "MT":"Motocicleta",
    "OF":"Ônibus",
    "OU":"Ônibus",
    "MC":"Ônibus",
    "VA":"Automóvel",
    "VC":"Caminhão",
    "CM":"Automóvel",
    "CR":"Caminhão",
    "JI":"Automóvel",
    "OT":"Outros",
    "SI":"Sem Informação",
    "CO":"Carroça",
    "automóvel": "Automóvel",
    "moto": "Motocicleta",
    "ônibus": "Ônibus",
    "caminhonete": "Automóvel",
    "bicicleta": "Bicicleta",
    "caminhão": "Caminhão",
    "sem informação": "Sem Informação",
    "outro": "Outros",
    "van": "Automóvel",
    "micro-ônibus": "Ônibus",
    "ônibus urbano": "Ônibus",
    "carreta": "Outros",
    "carroça": "Carroça",
    "jipe": "Automóvel",
    "ônibus fretado": "Ônibus",
    "ônibus Fretado": "Ônibus",
}
TIPOS_VITIMA={
    "CD":"Condutor",
    "PS":"passageiro",
    "PD":"Pedestre",
    "OU":"Outros",
    "SI":"Sem Informação",
    "Condutor":"Condutor",
    "Passageiro":"Passageiro",
    "Pedestre":"Pedestre",
    "Sem Informação":"Sem Informação",
    "Outros": "Sem Informação",

}
CLASS_VITIMA={
    "F":"Ferida",
    "M":"Morta",
    "Ferida": "Ferida",
    "Morta": "Morta",
}
GENERO={
    "M":"Masculino",
    "F":"Feminino",
    "Masculino":"Masculino",
    "Feminino":"Feminino",
    "SI": "Sem Informação",
    "Sem Informação": "Sem Informação",
}
CLASSIFICACAO={
    "F":"Grave",
    "M":"Fatal",
    "Ferida": "Grave",
    "Morta": "Fatal",
}

password=getpass.getpass("Senha:")
username="admin"

client=requests.session()
URL=re.sub("\/$", "", url)
print(URL)
r=client.get(URL+"/api-auth/login/?next=/api/", verify=False)
csrf=r.cookies.get('csrftoken')
cookies=r.cookies
print("até aqui ok")
r=client.post(URL+"/api-auth/login/", data={"username":username,"password":password,"csrfmiddlewaretoken":csrf,"next":"/api/"},cookies=r.cookies,headers={"referer":URL+"/api-auth/login/?next=/api/"},verify=False)
if r.status_code==403:
    print("Login inválido.")
    exit()
r=client.get(URL+"/api/recordtypes/?active=True&format=json",cookies=r.cookies,headers={"referer":URL+"/api/"})
j=r.json()

headers={'Content-type': 'application/json', "X-CSRFToken": client.cookies.get('csrftoken'),
                "Referer": URL + "/api/recordtypes/?active=True&format=json"}

schema=None
for i in range(0, len(j['results'])):
    print(i)
    print( j['results'][i]['current_schema'])
    if j['results'][i]['label']=='Sinistro':
        schema = j['results'][i]['current_schema']
if not schema:
    print("schema não existe. Criando.")
    schema=create_schema('sp/schema.json', URL + "/api", client, headers, r.cookies, "Sinistro", "Sinistros")
else:
    print("Schema já existe")













def is_incident(thing):
    return re.match('Sinistr.*', thing['label'])

data_type = list(filter(is_incident, j['results']))[0]
r=client.get(URL+"/api/recordschemas/%s/"%(data_type["current_schema"]),cookies=r.cookies,headers={"referer":URL+"/api/recordtypes/?active=True&format=json"})
j=r.json()
n=0

for filename in glob.glob("%s/incidentes.csv" % (carrega_csv.directory)):	
    lrecords = list(extract(filename,';', '"', "ISO-8859-1"))
    
    bar = progressbar.ProgressBar(maxval=len(lrecords), widgets=[progressbar.Bar('=', '[', ']'), ' ',progressbar.ETA(),' ', progressbar.Percentage()])
    bar.start()    
    _ibar=0
    for record in lrecords:
        #print(record)
        _ibar+=1;bar.update(_ibar);
        #count_records+=1
        #print(str(count_records)+'/'+str(total_records), end='\r\n')

        
        ano=1984
        n+=1
        if 'id_acidente' not in record:
            record['id_acidente'] = record['id_acident']
        print(record['id_acidente'])
        if record['id_acidente'] in existent:
            print("ja tem %s"%(record['id_acidente'],))
        else:
            #if n>20:
            #    break
            if "data_e_hora" in record:
                    stringdate = record['data_e_hora']
            else:
                if len(record['data'])>10:
                    record['data'],nada=record['data'].split(' ')
                ano, mes , dia = record['data'].split('/')
                if int(dia)>int(ano):
                    d=ano
                    ano=dia
                    dia=d
                if re.match("\d+:\d+",record['hora']):
                    hora, minuto= record['hora'].split(':')
                else:
                    if len(record['hora'])>8:
                        nada,hora=record['hora'].split(' ')
                        hora,minuto,segundo=hora.split(':')
                        ## print(hora+"::"+minuto)
                    else:
                        while len(record['hora'])<4:
                            record['hora']='0'+record['hora']
                        a, hora, minuto, b = re.split('^(\d+)(\d{2})',record['hora'])
                stringdate="%s-%s-%s %s:%s:00"%(ano,mes,dia,hora,minuto)
            occurred_date = pytz.timezone('America/Sao_Paulo').localize(parser.parse(stringdate))

            tipo=None
            tipo_resumido = 'Sem informações'

            if not 'tipo_acide' in record:
                if 'TipoAcidente' in record:
                    record['tipo_acide'] = record['TipoAcidente']
                else:
                    record['tipo_acide']=record['tipo_acidente']
            if record['tipo_acide'] in TIPOS_COLISAO:
                tipo=TIPOS_COLISAO[record['tipo_acide']]
            if tipo is None:
                tipo = 'Sem informações'
            else:
                if record['tipo_acide'] in TIPOS_RESUMIDOS_COLISAO:
                    tipo_resumido = TIPOS_RESUMIDOS_COLISAO[record['tipo_acide']]
            """
            if not 'mortos' in record:
                a,f,m,b=re.split('^(\d+)(\d{2})',record['vitimas'])
                record['mortos']=m
                record['feridos']=f
            """
            #num_vitimas=int(record['mortos'])+int(record['feridos'])
            #print(num_vitimas)
            num_veiculos=0
            for key in [
                    "carros",
                    "caminhao",
                    "bicicleta",
                    "moto",
                    "onibusmicr",
                    "van",
                    "vuc",
                    "carreta",
                    "carroca",
                    "outros",
                ]:
                if key in record:
                    num_veiculos+=int(record[key])
            #if "veiculos" in record:
            #    num_veiculos=sum([int(n) for n in list(record["veiculos"])])
            num_veiculos=0
            #"[{'placa': 'EHP0938', 'tipo_veiculo': 'MO', 'sexo_condutor': 'M', 'id_acidente': 'D011600179', 'idade_condutor': '36', 'categoria_habilitacao': 'SI', 'escolaridade': '8', 'estado_alcoolizacao': 'BR', 'id_veiculo': '1', 'usa_cinto_seguranca': 'X'}, {'placa': 'FKE8500', 'tipo_veiculo': 'AU', 'sexo_condutor': 'M', 'id_acidente': 'D011600179', 'idade_condutor': '36', 'categoria_habilitacao': 'SI', 'escolaridade': '8', 'estado_alcoolizacao': 'BR', 'id_veiculo': '2', 'usa_cinto_seguranca': 'X'}]
            vei=[]
            veiculos_ids={}
            casualties={
                "mortos":0,
                "feridos":0
            }
            if record['id_acidente'] in veiculos:
                for v in veiculos[record['id_acidente']]:
                    ## print("veiculo")
                    ## print(v)
                    tv_res=None
                    if not 'tipo_veiculo' in v:
                        v['tipo_veiculo'] = v['TipoVeiculo']
                    if v['tipo_veiculo'] in TIPOS_VEICULO_RESUMIDO:
                        tv_res=TIPOS_VEICULO_RESUMIDO[v['tipo_veiculo']]
                    veiculo = {
                        'Tipo de Veículo':tv_res,
                        'Veículo':TIPOS_VEICULO[v['tipo_veiculo']]
                    }
                    #if 'placa' in v:
                    #    veiculo['Placa']= v['placa']
                    _add_local_id(veiculo)
                    if re.match("\\d+",v['id_veiculo']):
                        veiculos_ids[str(int(v['id_veiculo']))]=veiculo
                    vei.append(veiculo)
                    num_veiculos+=1
            vit=[]
            if record['id_acidente'] in vitimas:
                for v in vitimas[record['id_acidente']]:
                    print(v)
                    obito=""
                    if v['DataObito'] != '':
                        obito=v['DataObito']
                    condicao='Ferido'
                    if v['classificacao'] == 'M' or v['classificacao'] == 'Morta' or v['classificacao'] == 'Morto':
                        condicao='Morto'
                        casualties["mortos"]+=1
                    else:
                        casualties["feridos"]+=1
                    if not 'tipo_vitima' in v:
                        v['tipo_vitima']=v['TipoVitima']
                    tipo_vitima=v['tipo_vitima']
                    if v['tipo_vitima'] == 'CD':
                        tipo_vitima = 'Condutor'
                    if v['tipo_vitima'] == 'PS':
                        tipo_vitima = 'Passageiro'
                    if v['tipo_vitima'] == 'PD':
                        tipo_vitima = 'Pedestre'
                    if v['tipo_vitima'] == 'Outros':
                        tipo_vitima = 'Sem Informação'

                    sexo="Sem Informação"
                    if v['sexo'] == "F":
                        sexo = "Feminino"
                    if v["sexo"] == "M":
                        sexo = "Masculino"
                    if v['sexo'] == "Feminino":
                        sexo = "Feminino"
                    if v["sexo"] == "Masculino":
                        sexo = "Masculino"

                    faixa="Sem Informação"
                    if v['idade'].isnumeric():
                        idade=int(v["idade"])
                        if idade >=60:
                            faixa = "60 ou mais"
                        else:
                            if idade >=30:
                                faixa = "30 a 59"
                            else:
                                if idade >=25:
                                    faixa = "25 a 29"
                                else:
                                    if idade >=20:
                                        faixa = "20 a 24"
                                    else:
                                        if idade >=18:
                                            faixa = "18 a 19"
                                        else:
                                            if idade >=15:
                                                faixa = "15 a 17"
                                            else:
                                                if idade >=11:
                                                    faixa = "11 a 14"
                                                else:
                                                    if idade >=6:
                                                        faixa="6 a 10"
                                                    else:
                                                        if idade >=0:
                                                            faixa="5 ou menos"
                    vitima={
                        'Idade':v['idade'],
                        'Gênero':sexo,
                        'Condição':condicao,
                        'Tipo de Vítima':tipo_vitima,
                        'Faixa etária':faixa,
                        'Data de Óbito':obito,
                    }
                    if re.match("\\d+",v['id_veiculo']):
                        if str(int(v['id_veiculo'])) in veiculos_ids:
                            ## print("Veiculo da vitima")
                            ## print(veiculos_ids[str(int(v['id_veiculo']))])
                            vitima['Veículo']=veiculos_ids[str(int(v['id_veiculo']))]['_localId']
                            ## print(vitima)

                    _add_local_id(vitima)
                    vit.append(vitima)
            if int(casualties['mortos']) > 0:
                severidade="Vítimas Fatais"
            else:
                if int(casualties['feridos']) > 0:
                    severidade="Vítimas Feridas"
                else:
                    severidade="Vítimas Feridas"
 #           try:
  #          if(float(record['x']))!=0:
            endereco=record["nomeA"]
            if record["nomeB"] != "":
                endereco+=' X %s' % (record["nomeB"])

            point = ogr.Geometry(ogr.wkbPoint)
            point.AddPoint(float(record['longitude']), float(record['latitude']))

            distrito=""
            for index in range(distritos.GetFeatureCount()):
                feature = distritos.GetFeature(index)
                geometry = feature.GetGeometryRef()
                if geometry.Contains(point):
                    distrito=feature.GetField(1)
            subprefeitura=""
            for index in range(subs.GetFeatureCount()):
                feature = subs.GetFeature(index)
                geometry = feature.GetGeometryRef()
                if geometry.Contains(point):
                    subprefeitura=feature.GetField(1)
            obj = {
                'data': {
                    'driverIncidenteDetails': {
                        "Acidente":tipo,
                        "Tipo de Acidente":tipo_resumido,
                        "acidente_id":record['id_acidente'],
                        "Severidade": severidade,
                        "Veículos": num_veiculos,
                        "Vítimas": casualties['mortos']+casualties['feridos'],
                        "Mortos": casualties["mortos"],
                        "Feridos":casualties["feridos"],
                        "Endereço": endereco,
                        "Distrito":distrito,
                        "Subprefeitura": subprefeitura
                    },
                    'driverVitima': vit,
                    'driverVeiculo': vei
                },
                'schema': str(r.json()['uuid']),
                'occurred_from': occurred_date.isoformat(),
                'occurred_to': occurred_date.isoformat(),
                "geom":"SRID=4326;POINT(%s %s)" % (float(record['longitude']), float(record['latitude']),)
            }


            _add_local_id(obj['data']['driverIncidenteDetails'])
            print(obj)

            if int(ano) > 2014 and 'geom' in obj:
                response = client.post(URL + '/api/records/',
                                       json=obj,
                                       headers={'Content-type': 'application/json', "X-CSRFToken": csrf,
                                                "Referer": URL + "/api/recordtypes/?active=True&format=json"},
                                       cookies=cookies,
                                       verify=False
                                       )
                
                ## print(response)
                ## print(response.status_code)
                if response.status_code == 201:
                    fu = open("sp/%s"%(written), "a")
                    fu.write(record['id_acidente'] + "\n")
                    fu.close()
                else:
                    print(response.content)
                    exit()
    bar.finish()
