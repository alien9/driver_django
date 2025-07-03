import { Component, OnInit, NgZone, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import isEqual from 'lodash.isequal';
import { ObjectUnsubscribedError } from 'rxjs';
import { FieldfilterPipe } from '../fieldfilter.pipe';
import { HostListener } from '@angular/core';


@Component({
  selector: 'app-jsoneditor',
  inputs: ['textarea'],
  templateUrl: './jsoneditor.component.html',
  styleUrls: ['./jsoneditor.component.css']
})
export class JSONEditorComponent implements OnInit {
  textarea: string;
  field_name: string = "json-content";
  dict: any = null;
  referables: any;
  teste: string;
  mode = 'tree';
  subtypes = [];
  active: any;
  activeKey: any;
  code: boolean = false;
  public dict_json: string = ""
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey) {
      if (event.key == 'y') {
        localStorage.setItem("content", JSON.stringify(this.dict))
      }
      if (event.key == 'i') {
        this.dict = JSON.parse(localStorage.getItem("content"))
      }
    }
  }
  fieldtypes = [
    { id: 'text', name: 'text' },
    { id: 'integer', name: 'integer' },
    { id: 'selectlist', name: 'selectlist' },
    { id: 'reference', name: 'reference' },
    { id: 'number', name: 'number' },
    { id: 'image', name: 'image' },
    { id: 'file', name: 'file' },
    { id: 'unique', name: 'unique' },
    { id: 'boundary', name: 'boundary' },
    { id: 'illustration', name: 'illustration' },
  ]
  formats = [
    { id: "text", name: "Single line text" },
    { id: "textarea", name: "Paragraph text" },
    { id: "datetime", name: "Date / Time" },
    { id: "suggest", name: "Auto Complete" },
  ]

  constructor(private elementRef: ElementRef, private zone: NgZone,) {
    this.textarea = this.elementRef.nativeElement.getAttribute('textarea_id');
    this.field_name = this.elementRef.nativeElement.getAttribute('textarea_name');
  }

  ngOnInit(): void {
    if (this.textarea) {
      try {
        this.set(JSON.parse((<HTMLInputElement>window.document.getElementById(this.textarea)).value));
      } catch (e) {
        this.set({ "properties": {} });
      }
    } else {
      this.set({ "properties": {} });
    }
    this.save()
  }
  load(event): void {
    try {
      this.set(JSON.parse(event.srcElement.value));
    } catch (e) {
      this.dict = {};
    }
  }
  set(v): void {
    this.dict = v;
    this.referables = Object.keys(this.dict.properties).filter(key => this.dict.definitions[key].multiple).map(k => ({ "key": k, "value": this.dict.definitions[k] }));
    this.save()
  }
  onclick(): void {
  }
  compareByOptionId(idFist, idSecond): boolean {
    return idFist && idSecond && idFist == idSecond;
  }
  setActive(x, key = null): void {
    this.active = x;
    if (key !== null) {
      this.activeKey = key;
    } else {
      this.activeKey = null;
    }
    this.save()
  }
  isActive(x, key = null): boolean {
    if (key !== null) {
      return isEqual(this.active, x) && (key == this.activeKey);
    }
    return isEqual(this.active, x);
  }
  renamekey(o, oldkey, event): void {
    var h = {};
    const v=event.srcElement.value.replace(/^\s*|\s*$/g,'')
    if(v==oldkey) return
    for (var k in o.properties) {
      if (isEqual(v, k)) {
        this.setActive(null);
        alert(`Duplicate ${k} not allowed!` )
        this.dict = JSON.parse(JSON.stringify(this.dict))
        return;
      }
      if (k == oldkey) {
        h[v] = o.properties[k];
      } else {
        h[k] = o.properties[k];
      }
    }
    Object.keys(h).forEach((k) => {
      if (h[k].condition && (h[k].condition == oldkey)) {
        h[k].condition = v
      }
    })

    if (o.required && (o.required.indexOf(oldkey) >= 0)) {
      o.required.splice(o.required.indexOf(oldkey), 1);
      o.required.push(v);
    }

    o.properties = h;
    this.save()
  }
  newTable(): void {
    let title = null
    title = prompt('Table name:')
    if (!title) {
      return
    }
    let tablename = `driver${title.normalize("NFD").replace(/[\u0300-\u036f]|\s/g, "")}`;
    let propertyOrder: number = 0;
    for (var j in this.dict.properties) {
      if (j == tablename) {
        var version = 0;
        while (this.dict.properties[tablename]) {
          version++;
          tablename = (tablename + "0").replace(/\d+$/, "" + version);
        }
      }
      if (this.dict.properties[j].propertyOrder >= propertyOrder) {
        propertyOrder = 1 + this.dict.properties[j].propertyOrder;
      }
    }

    var properties = {};
    var definitions = {};
    for (var k in this.dict.properties) {
      properties[k] = this.dict.properties[k];
      definitions[k] = this.dict.definitions[k];
    }
    properties[tablename] = {
      "$ref": "#/definitions/" + tablename,
      "options": { "collapsed": true },
      "propertyOrder": propertyOrder
    };
    definitions[tablename] = {
      "type": "object",
      "title": title,
      "multiple": false,
      "details": false,
      "required": ["_localId"],
      "properties": {
        "_localId": { "type": "string", "options": { "hidden": true }, "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$" },
      },
      "definitions": {},
      "description": "",
      "plural_title": "",
      "propertyOrder": propertyOrder
    };
    this.dict.definitions = definitions;
    this.dict.properties = properties;
    this.set(this.dict);
  }
  setMode(s, e): void {
    if (s == 'tree') {
      if (e) {
        try {
          this.set(JSON.parse(this.dict_json));
        } catch (e) {

        }
      }
    } else {
      this.save()
    }
    this.mode = s;
  }
  renameModel(model, event): void {
    let title = event.srcElement.value;
    if (title == model)
      return;
    title = title.normalize("NFD").replace(/[\u0300-\u036f]|\s/g, "");
    title = 'driver' + title[0].toUpperCase() + title.slice(1);
    let h = {};
    let hc = {};
    for (var k in this.dict.properties) {
      if (k == title) {
        var version = 0;
        while (this.dict.properties[title]) {
          version++;
          title = (title + "0").replace(/\d+$/, "" + version);
        }
      }
    }
    for (var k in this.dict.properties) {
      if (k == model) {
        h[title] = this.dict.properties[k];
        hc[title] = this.dict.definitions[k];
      } else {
        h[k] = this.dict.properties[k];
        hc[k] = this.dict.definitions[k];
      }
    }
    h[title]["items"] = {
      "$ref": "#/definitions/" + title
    };
    h[title]["title"] = event.srcElement.value;
    this.dict.properties = h;
    this.dict.definitions = hc;
    let res = { "properties": h, "definitions": hc };
    this.set(res);
  }
  newOption(f, elem, fld): void {
    let i = 0
    if (f.enum) {
      i = f.enum.length
      if (i == 0 || f.enum[i - 1] != "")
        f.enum.push("");
    }
    if (f.items && f.items.enum) {
      i = f.items.enum.length
      if (i == 0 || f.items.enum[i - 1] != "")
        f.items.enum.push("");
    }
    this.resetIllustrations(elem, fld)
    this.save()
  }
  removeOption(f, o): void {
    if (f.enum)
      f.enum.splice(o, 1);
    if (f.items && f.items.enum)
      f.items.enum.splice(o, 1);
    this.save()
  }
  setPropertyValue(a, i, event): void {
    a[i] = event.srcElement.value.replace(/^\s*|\s*$/g, '');
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setEnumValue(t, f, i, event): void {
    this.dict.definitions[t].properties[f].enum[i] = event.srcElement.value.replace(/^\s*|\s*$/g,'')
    this.resetIllustrations(t, f)
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setPropertyByKey(f, t, p, event) {
    this.dict.definitions[t].properties[f][p] = event.srcElement.value.replace(/^\s*|\s*$/g,'')
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  refresh() {
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setIllustratedTable(t, event) {
    this.dict.definitions[t].illustrated = event.srcElement.checked
    this.refresh()
  }
  setIllustrationTable(t, event) {
    const ilu = event.srcElement.value
    if (ilu != '') {
      this.dict.definitions[t].illustration = ilu
    } else {
      //delete this.dict.definitions[t].illustration
    }
    this.refresh()
  }
  setConditionComparison(a, table, f, event): void {
    a.conditionComparison = event.srcElement.value
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setConditionRegex(table, f, event): void {
    const v = event.srcElement.value
    if (v == '') {
      delete this.dict.definitions[table].properties[f].conditionRegex
    } else {
      this.dict.definitions[table].properties[f].conditionRegex = v

    }
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }

  setLength(f, event): void {
    f['length'] = event.srcElement.value
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }

  setCondition(a, table, f, event): void {
    a.condition = event.srcElement.value
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setFieldType(a, b, event): void {
    let t = event.srcElement.value
    this.dict.definitions[a].properties[b].fieldType = t
    if(['text'].indexOf(t)==-1){
      delete this.dict.definitions[a].properties[b]['length']
    }
    if(t!="datetime"){
      delete this.dict.definitions[a].properties[b]['yearsPast']
      delete this.dict.definitions[a].properties[b]['yearsFuture']      
    }
    let c = this.setTarget(this.dict.definitions[a].properties[b], t, true)
    this.save()
  }
  deactivate(): void {
    this.setActive(null);
  }
  setExtra(o, event) {
    let f = ""
    f = event?.srcElement?.value
    if (f) {
      o.extra = f
    }
    else {
      delete o.extra
    }
    this.save()
  }
  setDisplayType(o, event) {
    if (event.srcElement.value == 'checkbox') {
      delete o.extra;
      o.format = 'checkbox';
      o.type = "array";
      delete o.displayType;
      if (!o.items)
        o.items = (o.enum) ? { enum: o.enum } : { enum: [] };
      o.items["type"] = "string";
      o.uniqueItems = true;
      delete o.enum;
    } else {
      delete o.format;
      if ((event.srcElement.value == 'select') || (event.srcElement.value == 'radio')) delete o.extra
      o.displayType = event.srcElement.value; // select or autocomplete
      o.type = "string";
      if (!o.enum)
        o.enum = (o.items && o.items.enum) ? o.items.enum : [];
      delete o.items;
      delete o.uniqueItems;
    }
    this.save()
  }
  setTarget(o, event, format = false) {
    if (event != "integer") {
      delete o.min
      delete o.max
      delete o.def
    }

    if (format) {
      if (event != "suggest")
        delete o.extra
    } else {
      if (event != "text") {
        delete o.format
      }
    }
    if (event == "image") {
      o["media"] = {
        binaryEncoding: "base64",
        type: "image/jpeg"
      }
    } else {
      delete o["media"]
    }
    if (event == "reference") {
      o["watch"] = { "target": null };
      o["enumSource"] = [
        {
          "title": "",
          "value": "{{item._localId}}",
          "source": "target"
        }
      ];
    } else {
      delete o["watch"];
      delete o["enumSource"];
    }
    if (event == "selectlist") {
      o["type"] = "string";
      o["enum"] = [];
      o["displayType"] = "select";
    } else {
      delete o["enum"];
      delete o["items"];
      delete o.extra;
    }
    if (event == "number") {
      o["type"] = "number";
    } else if (event == "integer") {
      o["type"] = "integer";
    } else {
      o["type"] = "string";
    }
    this.save()
    return o;
  }
  contains(array, o) {
    return array.includes(o);
  }
  setIllustration(tb, f, ixd, event) {
    if (!this.dict.definitions[tb].properties[f].illustrations) this.dict.definitions[tb].properties[f].illustrations = []
    while (this.dict.definitions[tb].properties[f].illustrations.length <= ixd)
      this.dict.definitions[tb].properties[f].illustrations.push(null)
    if (this.dict.definitions[tb].properties[f].enum) {
      while (this.dict.definitions[tb].properties[f].illustrations.length > this.dict.definitions[tb].properties[f].enum.length)
        this.dict.definitions[tb].properties[f].illustrations.pop()
    }
    this.dict.definitions[tb].properties[f].illustrations[ixd] = event.srcElement.value
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setIllustrationField(tb, f, event) {
    this.dict.definitions[tb].properties[f].illustration = event.srcElement.value
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  resetIllustrations(t, o) {
    if ((this.dict.definitions[t].properties[o].enum) && (this.dict.definitions[t].properties[o].isIllustrated)) {
      this.dict.definitions[t].properties[o].illustrations = this.dict.definitions[t].properties[o].enum.map((fm, indx) => {
        if (this.dict.definitions[t].properties[o].illustrations && (this.dict.definitions[t].properties[o].illustrations.length > indx)) {
          return this.dict.definitions[t].properties[o].illustrations[indx]
        }
        if (fm && fm != '')
          return `/media/photologue/photos/cache/${fm}_${indx}.png`
        return null
      })
    } else {
      delete this.dict.definitions[t].properties[o].illustrations
    }
  }
  isUntitled(t, o) {
    return this.dict.definitions[t].properties[o].isUntitled
  }
  setUntitled(o,t,event){
    this.dict.definitions[t].properties[o].isUntitled = event.srcElement.checked
    this.save();
  }
  isIllustrated(t, o) {
    return this.dict.definitions[t].properties[o].isIllustrated
  }
  setIllustrated(o, t, event) {
    const isIllustrious = event.srcElement.checked
    this.dict.definitions[t].properties[o].isIllustrated = isIllustrious
    const options = this.dict.definitions[t].properties[o].enum
    if (isIllustrious) {
      if (this.dict.definitions[t].properties[o].enum) {
        this.dict.definitions[t].properties[o].illustrations = this.dict.definitions[t].properties[o].enum.map((fm) => {
          return `/media/photologue/photos/cache/${fm}.png`
        })
      } else {
        this.dict.definitions[t].properties[o].illustrations = [`/media/photologue/photos/cache/image.png`]
      }
    } else {
      delete this.dict.definitions[t].properties[o].illustrations
    }
    this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  isRequired(t, o) {
    if (this.dict.definitions[t].properties[o].condition) {
      return this.dict.definitions[t].properties[o].isRequired
    } else {
      return this.dict.definitions[t].required.indexOf(o) >= 0
    }
  }
  setRequired(o, t, event) {
    if (this.dict.definitions[t].properties[o].condition) {
      for (var i = 0; i < this.dict.definitions[t].required.length; i++) {
        if (this.dict.definitions[t].required[i] == o)
          this.dict.definitions[t].required.splice(i, 1);
      }
      this.dict.definitions[t].properties[o].isRequired = event.srcElement.checked
    } else {
      delete this.dict.definitions[t].properties[o].isRequired
      if (event.srcElement.checked) {
        if (!this.dict.definitions[t].required.includes(o))
          this.dict.definitions[t].required.push(o);
      } else {
        for (var i = 0; i < this.dict.definitions[t].required.length; i++) {
          if (this.dict.definitions[t].required[i] == o)
            this.dict.definitions[t].required.splice(i, 1);
        }
      }
    }
    this.save()
  }
  fixRequired() {
    if (!this.dict || !this.dict.definitions) return
    Object.keys(this.dict.definitions).forEach((k) => {
      if (this.dict.definitions[k].required) {
        let i = 0
        while (i < this.dict.definitions[k].required.length) {
          if (!this.dict.definitions[k].properties[this.dict.definitions[k].required[i]]) {
            this.dict.definitions[k].required.splice(i, 1)
          } else
            i++
        }
      }
    })
  }
  resetDenominations(t) {
    this.dict.definitions[t].denominations = []
    this.save()
  }
  addDenomination(t, e) {
    if (!this.dict.definitions[t].denominations) this.dict.definitions[t].denominations = []
    if (e.srcElement.value && (e.srcElement.value.length)) {
      if (this.dict.definitions[t].denominations.indexOf(e.srcElement.value) < 0)
        this.dict.definitions[t].denominations.push(e.srcElement.value)
    }
    this.save()
  }
  newField(definition): void {
    let h = {};
    let propertyOrder = 0;
    for (let i in definition.properties) {
      if (propertyOrder <= definition.properties[i].propertyOrder) {
        propertyOrder = definition.properties[i].propertyOrder + 1;
      }
      h[i] = definition.properties[i];
    }
    let key = "New property"
    if (h[key]) {
      let i = 1
      while (h[`${key} (${i})`]) {
        i++
      }
      key = `${key} (${i})`
    }
    h[key] = {
      "type": "string",
      "fieldType": "text",
      "isSearchable": false,
      "propertyOrder": propertyOrder
    };
    definition.properties = h;
    this.save()
    this.dict = JSON.parse(JSON.stringify(this.dict))
  }
  deleteField(definition, fieldname) {
    if (confirm("Delete " + fieldname + "?")) {
      let h = {};
      for (let i in definition.properties) {
        if (i != fieldname) {
          h[i] = definition.properties[i];
        }
      }
      definition.properties = h;

      if (definition.required && (definition.required.indexOf(fieldname) >= 0))
        definition.required.splice(definition.required.indexOf(fieldname), 1);
    }
    this.save()
  }
  moveFieldUpper(definition, fieldname) {
    let h = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    Object.entries(definition.properties).forEach(([key, value]) => {
      if (key == fieldname) {
        value["propertyOrder"] = 0
      } else {
        if (value["propertyOrder"] <= current_position) {
          value["propertyOrder"]++
        }
      }
      h[key] = value
    })
    let i = 0
    Object.keys(definition.properties).sort((a, b) => { return h[a]['propertyOrder'] - h[b]['propertyOrder'] }).forEach((k) => {
      h[k].propertyOrder = i
      i++
    })
    definition.properties = h;
    this.save()
  }
  moveFieldToIndex(definition, fieldname) {
    let h = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    const intended = window.prompt("Index:")
    let anterior=Object.entries(definition.properties).filter(([k,v])=>k==fieldname).map((v)=>v[1]['propertyOrder']).pop()
    Object.entries(definition.properties).sort((a, b) => a['propertyOrder'] - b['propertyOrder']).forEach(([key, value]) => {
      let v = value
      if (!isNaN(v["propertyOrder"])) {
        if (key == fieldname) {
          v["propertyOrder"] = parseInt(intended) - 1
        } else {
          if (v["propertyOrder"] > anterior) {
            v["propertyOrder"]--
          }
          if (v["propertyOrder"] >= parseInt(intended)-1){
            v["propertyOrder"]++  
          }
        }
      }
      h[key] = v
    })
    let i = 0
    Object.keys(definition.properties).sort((a, b) => { return h[a]['propertyOrder'] - h[b]['propertyOrder'] }).forEach((k) => {
      if (!isNaN(h[k].propertyOrder)) {
        h[k].propertyOrder = i
        i++
      }
    })
    definition.properties = h;
    this.save()
  }
  moveFieldUp(definition, fieldname) {
    let h = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    Object.entries(definition.properties).forEach(([key, value]) => {
      if (key == fieldname) {
        value["propertyOrder"]--
      } else {
        if (value["propertyOrder"] == current_position) {
          value["propertyOrder"]++
        }
      }
      h[key] = value
    })
    let i = 0
    Object.keys(definition.properties).sort((a, b) => { return h[a]['propertyOrder'] - h[b]['propertyOrder'] }).forEach((k) => {
      h[k].propertyOrder = i
      i++
    })
    definition.properties = h;
    this.save()
  }
  moveFieldDown(definition, fieldname) {
    let h = {};
    let current_position = definition.properties[fieldname].propertyOrder + 1
    Object.entries(definition.properties).forEach(([key, value]) => {
      if (key == fieldname) {
        value["propertyOrder"]++
      } else {
        if (value["propertyOrder"] == current_position) {
          value["propertyOrder"]--
        }
      }
      h[key] = value
    })
    let i = 0
    Object.keys(definition.properties).sort((a, b) => { return h[a]['propertyOrder'] - h[b]['propertyOrder'] }).forEach((k) => {
      h[k].propertyOrder = i
      i++
    })
    definition.properties = h;
    this.save()
  }
  moveFieldDowner(definition, fieldname) {
    let h = {};
    let current_position = definition.properties[fieldname].propertyOrder + 1
    Object.entries(definition.properties).forEach(([key, value]) => {
      if (key == fieldname) {
        value["propertyOrder"] = definition.properties.length
      } else {
        if (value["propertyOrder"] >= current_position) {
          value["propertyOrder"]--
        } else {

        }
      }
      h[key] = value
    })
    let i = 0
    Object.keys(definition.properties).sort((a, b) => { return h[a]['propertyOrder'] - h[b]['propertyOrder'] }).forEach((k) => {
      h[k].propertyOrder = i
      i++
    })
    definition.properties = h;
    this.save()
  }
  isNotLast(i, fieldset) {
    return Object.values(fieldset).length - 2 > i
  }


  deleteObject(o) {
    if (!confirm("Delete " + o.key + " permanently?"))
      return;
    let res = { "properties": {}, "definitions": {} };
    for (let key in this.dict.properties) {
      if (key != o.key) {
        res.properties[key] = this.dict.properties[key];
        res.definitions[key] = this.dict.definitions[key];
      }
    }
    this.set(res);
  }
  setPluralTitle(t, event) {
    t.plural_title = event.srcElement.value;
    this.save()
  }
  setReferables(event: Event) {
    this.referables = Object.keys(this.dict.properties).filter(key => this.dict.definitions[key].multiple).map(k => ({ "key": k, "value": this.dict.definitions[k] }));
    for (let key in this.dict.properties) {
      if (!this.dict.definitions[key].multiple) {
        delete (this.dict.properties[key].items);
        delete (this.dict.properties[key].plural_title);
        this.dict.properties[key]["$ref"] = "#/definitions/" + key;
        delete this.dict.properties[key].type;
      } else {
        delete (this.dict.properties[key]["$ref"]);
        this.dict.properties[key].items = { "$ref": "#/definitions/" + key };
        this.dict.properties[key].type = "array";
      }
    }
    this.set(JSON.parse(JSON.stringify(this.dict)));
  }
  hasFormat(name: string) {
    return (name == "text");
  }
  moveup(item, caller = null) {
    var d = this.dict['definitions']
    let o = 0
    Object.keys(this.dict['definitions']).sort((a, b) => { return d[a]['propertyOrder'] - d[b]['propertyOrder'] }).forEach(k => {
      d[k]['propertyOrder'] = o;
      o++;
    })
    let current_position = item.value.propertyOrder - 1
    let res = { "properties": this.dict['properties'], "definitions": {} };
    for (let key in this.dict.definitions) {
      if (key == item.key) {
        this.dict.definitions[key].propertyOrder--
      } else {
        if (this.dict.definitions[key].propertyOrder == current_position) {
          this.dict.definitions[key].propertyOrder++
        }
      }
      res.properties[key] = this.dict.properties[key]
      res.definitions[key] = this.dict.definitions[key]
    }
    this.set(res);

    if (caller) {
      caller.focus();
    }
  }

  movedown(item) {
    var d = this.dict['definitions']
    let o = 0;
    Object.keys(this.dict['definitions']).sort((a, b) => { return d[a]['propertyOrder'] - d[b]['propertyOrder'] }).forEach(k => {
      d[k]['propertyOrder'] = o;
      o++;
    })

    let current_position = this.dict.definitions[item.key].propertyOrder + 1
    let res = { "properties": this.dict['properties'], "definitions": {} };

    for (let key in this.dict.definitions) {
      if (key == item.key) {
        this.dict.definitions[key].propertyOrder++
      } else {
        if (this.dict.definitions[key].propertyOrder == current_position) {
          this.dict.definitions[key].propertyOrder--
        }
      }
      res.definitions[key] = this.dict.definitions[key]
    }
    this.set(res);
  }
  isLast(i) {
    return i < Object.values(this.dict.properties).length - 1
  }
  save() {
    this.fixRequired()
    this.dict_json = JSON.stringify(this.dict)
  }
  setDetails(eve, element, key) {
    for (var k in this.dict.definitions) {
      this.dict.definitions[k].details = false;
    }
    for (var k in this.dict.properties) {
      this.dict.properties[k].details = false;
    }
    this.dict.properties[key].details = true
    element.details = true;
    this.save();
  }
}
