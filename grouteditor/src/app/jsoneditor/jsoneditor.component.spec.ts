import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JSONEditorComponent } from './jsoneditor.component';
import { FieldfilterPipe } from '../fieldfilter.pipe';
import { SortedhashPipe } from '../sortedhash.pipe';
import { By } from '@angular/platform-browser';
const basic_object = {
  "properties": {
    "drivertabuleta": {
      "$ref": "#/definitions/drivertabuleta",
      "options": {
        "collapsed": true
      },
      "propertyOrder": 0
    }
  },
  "definitions": {
    "drivertabuleta": {
      "type": "object",
      "title": "tabuleta",
      "multiple": false,
      "details": false,
      "required": [
        "_localId"
      ],
      "properties": {
        "_localId": {
          "type": "string",
          "options": {
            "hidden": true
          },
          "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"
        }
      },
      "definitions": {},
      "description": "",
      "plural_title": "",
      "propertyOrder": 0
    }
  }
}
describe('JSONEditorComponent', () => {
  let component: JSONEditorComponent;
  let fixture: ComponentFixture<JSONEditorComponent>;
  let value: any;
  value = '{"uuid": "45771b6a-ec6b-46ce-b26c-2e758a63376e", "schema": {"type": "object", "title": "", "$schema": "http://json-schema.org/draft-04/schema#", "properties": {"driverVitima": {"type": "array", "items": {"$ref": "#/definitions/driverVitima"}, "title": "Vitima", "options": {"collapsed": true}, "plural_title": "Vitimas", "propertyOrder": 4}, "driverVeiculo": {"type": "array", "items": {"$ref": "#/definitions/driverVeiculo"}, "title": "Veiculo", "options": {"collapsed": true}, "plural_title": "Veiculos", "propertyOrder": 5}, "driverIncidenteDetails": {"$ref": "#/definitions/driverIncidenteDetails", "options": {"collapsed": true}, "propertyOrder": 1}}, "definitions": {"driverVitima": {"type": "object", "title": "Vitima", "multiple": true, "required": ["_localId"], "properties": {"Faixa": {"enum": ["5 ou menos", "6 a 10", "11 a 14", "15 a 17", "18 a 19", "20 a 24", "25 a 29", "30 a 59", "60 ou mais", "Sem Informa\u00e7\u00e3o"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": true, "propertyOrder": 4}, "Idade": {"type": "string", "format": "number", "fieldType": "text", "isSearchable": false, "propertyOrder": 2}, "G\u00eanero": {"enum": ["Masculino", "Feminino", "Sem Informa\u00e7\u00e3o"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": true, "propertyOrder": 0}, "Ve\u00edculo": {"type": "string", "watch": {"target": "driverVeiculo"}, "fieldType": "reference", "enumSource": [{"title": "{{item.Placa}} {{item.Tipo de Ve\u00edculo}} {{item.Ve\u00edculo}}", "value": "{{item._localId}}", "source": "target"}], "propertyOrder": 5}, "_localId": {"type": "string", "options": {"hidden": true}, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"}, "Condi\u00e7\u00e3o": {"enum": ["Ferido", "Morto"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": false, "propertyOrder": 1}, "Tipo de V\u00edtima": {"enum": ["Condutor", "Passageiro", "Pedestre", "Sem Informa\u00e7\u00e3o"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": false, "propertyOrder": 3}}, "definitions": {}, "description": "Vitima de incidente", "plural_title": "V\u00edtimas"}, "driverVeiculo": {"type": "object", "title": "Veiculo", "multiple": true, "required": ["_localId"], "properties": {"Ve\u00edculo": {"enum": ["Auto", "Moto", "\u00d4nibus", "Caminh\u00e3o", "Bicicleta", "Moto T\u00e1xi", "\u00d4nibus Fretado/Intermunicipal", "\u00d4nibus Urbano", "Micro\u00f4nibus", "Van", "Vuc", "Caminhonete/Camioneta", "Carreta", "Jipe", "Carro\u00e7a", "Outros", "Sem Informa\u00e7\u00e3o"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": false, "propertyOrder": 1}, "_localId": {"type": "string", "options": {"hidden": true}, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"}, "Tipo de Ve\u00edculo": {"enum": ["Autom\u00f3vel", "Motocicleta", "\u00d4nibus", "Caminh\u00e3o", "Bicicleta", "Carro\u00e7a", "Sem Informa\u00e7\u00e3o", "Outros"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": true, "propertyOrder": 0}}, "definitions": {}, "description": "Veiculo envolvido em Incidente", "plural_title": "Ve\u00edculos"}, "driverIncidenteDetails": {"type": "object", "title": "Incidente Details", "details": true, "multiple": false, "required": ["_localId"], "properties": {"Mortos": {"type": "integer", "fieldType": "integer", "isSearchable": false, "propertyOrder": 4}, "Feridos": {"type": "integer", "fieldType": "integer", "isSearchable": false, "propertyOrder": 7}, "Acidente": {"enum": ["Colis\u00e3o", "Colis\u00e3o frontal", "Colis\u00e3o traseira", "Colis\u00e3o lateral", "Colis\u00e3o transversal", "Capotamento", "Tombamento", "Choque", "Atropelamento", "Atropelamento de animal", "Queda moto/bicicleta", "Queda moto", "Queda bicicleta", "Queda ve\u00edculo", "Queda ocupante dentro", "Queda ocupante fora", "Outros", "Sem informa\u00e7\u00f5es"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": false, "propertyOrder": 3}, "Distrito": {"type": "string", "fieldType": "text", "isSearchable": false, "propertyOrder": 10}, "V\u00edtimas": {"type": "integer", "fieldType": "integer", "isSearchable": false, "propertyOrder": 6}, "_localId": {"type": "string", "options": {"hidden": true}, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"}, "Endere\u00e7o": {"type": "string", "format": "text", "fieldType": "text", "isSearchable": true, "propertyOrder": 0}, "Ve\u00edculos": {"type": "integer", "fieldType": "integer", "isSearchable": false, "propertyOrder": 5}, "Severidade": {"enum": ["V\u00edtimas Feridas", "V\u00edtimas Fatais"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": true, "propertyOrder": 1}, "acidente_id": {"type": "string", "fieldType": "text", "isSearchable": false, "propertyOrder": 8}, "Subprefeitura": {"type": "string", "fieldType": "text", "isSearchable": false, "propertyOrder": 9}, "Tipo de Acidente": {"enum": ["Atropelamento", "Colis\u00e3o", "Choque", "Queda", "Capotamento", "Sem informa\u00e7\u00f5es", "Outros"], "type": "string", "fieldType": "selectlist", "displayType": "select", "isSearchable": true, "propertyOrder": 2}}, "definitions": {}, "description": "Details for Incidente", "plural_title": "Incidente Details", "propertyOrder": 0}}, "description": "", "plural_title": ""}, "created": "2020-02-17T17:07:39.061495-03:00", "version": 2, "modified": "2020-02-18T10:45:04.052195-03:00", "record_type": "5d7a734d-fe24-49f0-8f09-ecf6f63a46dc", "next_version": "b1f51592-b177-45e9-9210-32057c855cd0"}';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JSONEditorComponent, SortedhashPipe, FieldfilterPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JSONEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create table', () => {
    spyOn(window, "prompt").and.returnValue("tabuleta");
    const compiled = fixture.nativeElement;
    compiled.querySelector('.subtype .new').click();
    expect(window.prompt).toHaveBeenCalledWith("Table name:");
    expect(component.dict).toEqual(basic_object)
  });
  it('should create some fields', async () => {
    spyOn(window, "prompt").and.returnValue("tabuleta");
    let compiled = fixture.nativeElement;
    compiled.querySelector('.subtype .new').click();
    fixture.detectChanges();
    expect(Object.keys(component.dict.definitions.drivertabuleta.properties).length).toBe(1)
    compiled.querySelector('.properties .new').click();
    expect(Object.keys(component.dict.definitions.drivertabuleta.properties).length).toBe(2)
    compiled.querySelector('.properties .new').click();
    expect(Object.keys(component.dict.definitions.drivertabuleta.properties).length).toBe(3)
  });
  it('load data and populate', () => {

    const compiled = fixture.nativeElement;
    console.log("buuuuu")
    console.log(component.dict)
    expect(component.dict).toEqual({
      "properties": {}
    })

    console.log(JSON.stringify(basic_object)) 

  fixture.detectChanges();
  compiled.querySelector('a.code').click()
    compiled.querySelector('textarea.raw').value = JSON.stringify(basic_object);
    fixture.detectChanges();
    component.dict_json=JSON.stringify(basic_object);
    compiled.querySelector('a.tree').click()
    fixture.detectChanges();
    expect(component.dict).toEqual(basic_object)
  });

});
