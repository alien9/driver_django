import { Component, OnInit, NgZone, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HostListener } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FieldfilterPipe } from '../fieldfilter.pipe';
import { SortedhashPipe } from '../sortedhash.pipe'
import { signal } from '@angular/core';
import deepEqual from 'deep-equal';

@Component({
  selector: 'app-jsoneditor',
  imports: [FormsModule, CommonModule, FieldfilterPipe, SortedhashPipe],
  inputs: ['currentvalue'],
  templateUrl: './jsoneditor.html',
  styleUrl: './jsoneditor.css'
})

export class Jsoneditor implements OnInit {
  @Input() textarea_id:string=""
  textarea: string;
  currentvalue:string;
  field_name: string = "json-content";

  referables: any;
  mode = 'tree';
  subtypes = [];
  active: any;
  activeKey: any;
  code: boolean = false;
  public dict_json: string = ""
  public dict: any = signal({});
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey) {
      if (event.key == 'y') {
        localStorage.setItem("content", this.dict_json)
      }
      if (event.key == 'i') {
        const b = localStorage.getItem("content")
        if (b != null) {
          let d = JSON.parse(b)
          this.dict.properties = d.properties
          this.dict.definitions = d.definitions
          this.dict_json = JSON.stringify(d)
        }
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
    { id: 'counter', name: 'counter' }
  ]
  formats = [
    { id: "text", name: "Single line text" },
    { id: "textarea", name: "Paragraph text" },
    { id: "datetime", name: "Date / Time" },
    { id: "suggest", name: "Auto Complete" },
  ]

  constructor(private elementRef: ElementRef, private zone: NgZone,) {
    this.textarea = this.elementRef.nativeElement.getAttribute('textarea_id');
    this.currentvalue = this.elementRef.nativeElement.getAttribute('currentvalue');
    this.field_name = this.elementRef.nativeElement.getAttribute('textarea_name');
  }
  ngAfterViewInit() {
    if (this.textarea_id && this.textarea_id!="") {
      try {
        const txt = window.document.getElementById(this.textarea_id)
        if (txt)
          this.set(JSON.parse(txt?.innerText));
      } catch (e) {
        this.set({ "properties": {} });
      }
    } else {
      this.set({ "properties": {} });
    }
    this.save()  }

  ngOnInit(): void {
    
  }
  load(event: any): void {
    try {
      this.set(JSON.parse(event.srcElement.value));
    } catch (e) {
      this.dict.update((value: any) => { });
    }
  }
  set(v: any): void {
    this.dict.properties = (v && v.properties) ? JSON.parse(JSON.stringify(v.properties)) : {}
    this.dict.definitions = (v && v.definitions) ? JSON.parse(JSON.stringify(v.definitions)) : {}
    this.referables = Object.keys(this.dict.properties).filter(key => this.dict.definitions[key].multiple).map(k => ({ "key": k, "value": this.dict.definitions[k] }));
    this.save()
  }
  onclick(): void {
  }
  compareByOptionId(idFist: any, idSecond: any): boolean {
    return idFist && idSecond && idFist == idSecond;
  }
  setActive(x: any, key: any): void {
    this.active = x;
    if (key !== null) {
      this.activeKey = key;
    } else {
      this.activeKey = null;
    }
    this.save()
  }
  isActive(x: any, key = null): boolean {
    if (key !== null) {
      return deepEqual(this.active, x) && (key == this.activeKey);
    }
    return deepEqual(this.active, x);
  }
  renamekey(o: any, oldkey: string, event: any): void {
    var h: any = {};
    const v = event.srcElement.value.replace(/^\s*|\s*$/g, '')
    if (v == oldkey) return
    for (var k in o.properties) {
      if (deepEqual(v, k)) {
        this.setActive(null, null);
        alert(`Duplicate ${k} not allowed!`)
        this.dict.update((value: any) => JSON.parse(JSON.stringify(this.dict)))
        return;
      }
      if (k == oldkey) {
        h[v] = o.properties[k];
      } else {
        h[k] = o.properties[k];
      }
    }
    Object.keys(h).forEach((k: string) => {
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

    var properties: any = {};
    var definitions: any = {};
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
  setMode(s: string, e: any): void {
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
  renameModel(model: string, event: any): void {
    let title = event.srcElement.value;
    if (title == model)
      return;
    title = title.normalize("NFD").replace(/[\u0300-\u036f]|\s/g, "");
    title = 'driver' + title[0].toUpperCase() + title.slice(1);
    let h: any = {};
    let hc: any = {};
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
  newOption(f: any, elem: any, fld: string): void {
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
  removeOption(f: any, o: any): void {
    if (f.enum)
      f.enum.splice(o, 1);
    if (f.items && f.items.enum)
      f.items.enum.splice(o, 1);
    this.save()
  }
  setPropertyValue(a: any, i: any, event: any): void {
    a[i] = event.srcElement.value.replace(/^\s*|\s*$/g, '');
    this.dict.update((value: any) => JSON.parse(JSON.stringify(this.dict)))
    this.save()
  }
  setMultiPropertyValue(a: any, i: any, event: any): void {
    a[i] = Array.from(event.srcElement.childNodes).filter((o:any)=>o.selected).map((o:any)=>o.innerText);
    this.save()
  }
  setEnumValue(t: string, f: string, i: number, event: any): void {
    this.dict.definitions[t].properties[f].enum[i] = event.srcElement.value.replace(/^\s*|\s*$/g, '')
    this.resetIllustrations(t, f)
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setPropertyByKey(f: string, t: string, p: string, event: any) {
    this.dict.definitions[t].properties[f][p] = event.srcElement.value.replace(/^\s*|\s*$/g, '')
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  refresh() {
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setIllustratedTable(t: string, event: any) {
    this.dict.definitions[t].illustrated = event.srcElement.checked
    this.refresh()
  }
  setIllustrationTable(t: string, event: any) {
    const ilu = event.srcElement.value
    if (ilu != '') {
      this.dict.definitions[t].illustration = ilu
    } else {
      //delete this.dict.definitions[t].illustration
    }
    this.refresh()
  }
  setConditionComparison(a: any, table: string, f: string, event: any): void {
    a.conditionComparison = event.srcElement.value
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setConditionRegex(table: string, f: string, event: any): void {
    const v = event.srcElement.value
    if (v == '') {
      delete this.dict.definitions[table].properties[f].conditionRegex
    } else {
      this.dict.definitions[table].properties[f].conditionRegex = v

    }
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }

  setLength(f: any, event: any): void {
    f['length'] = event.srcElement.value
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }

  setCondition(a: any, table: string, f: string, event: any): void {
    a.condition = event.srcElement.value
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setFieldType(a: string, b: string, event: any): void {
    delete this.dict.definitions[a].properties[b].counted
    delete this.dict.definitions[a].properties[b].countedFilter
    delete this.dict.definitions[a].properties[b].countedFilterRegex
    let t = event.srcElement.value
    this.dict.definitions[a].properties[b].fieldType = t
    if (['text'].indexOf(t) == -1) {
      delete this.dict.definitions[a].properties[b]['length']
    }
    if (t != "datetime") {
      delete this.dict.definitions[a].properties[b]['yearsPast']
      delete this.dict.definitions[a].properties[b]['yearsFuture']
    }
    let c = this.setTarget(this.dict.definitions[a].properties[b], t, true)
    this.save()
  }
  deactivate(): void {
    this.setActive(null, null);
  }
  setExtra(o: any, event: any) {
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
  setDisplayType(o: any, event: any) {
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
  setTarget(o: any, event: any, format = false) {
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
  contains(array: any, o: any) {
    return array.includes(o);
  }
  setIllustration(tb: string, f: string, ixd: number, event: any) {
    if (!this.dict.definitions[tb].properties[f].illustrations) this.dict.definitions[tb].properties[f].illustrations = []
    while (this.dict.definitions[tb].properties[f].illustrations.length <= ixd)
      this.dict.definitions[tb].properties[f].illustrations.push(null)
    if (this.dict.definitions[tb].properties[f].enum) {
      while (this.dict.definitions[tb].properties[f].illustrations.length > this.dict.definitions[tb].properties[f].enum.length)
        this.dict.definitions[tb].properties[f].illustrations.pop()
    }
    this.dict.definitions[tb].properties[f].illustrations[ixd] = event.srcElement.value
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  setIllustrationField(tb: string, f: string, event: any) {
    this.dict.definitions[tb].properties[f].illustration = event.srcElement.value
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  resetIllustrations(t: string, o: string) {
    if ((this.dict.definitions[t].properties[o].enum) && (this.dict.definitions[t].properties[o].isIllustrated)) {
      this.dict.definitions[t].properties[o].illustrations = this.dict.definitions[t].properties[o].enum.map((fm: string, indx: number) => {
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
  isUntitled(t: string, o: string) {
    return this.dict.definitions[t].properties[o].isUntitled
  }
  setUntitled(o: string, t: string, event: any) {
    this.dict.definitions[t].properties[o].isUntitled = event.srcElement.checked
    this.save();
  }
  isIllustrated(t: string, o: string) {
    return this.dict.definitions[t].properties[o].isIllustrated
  }
  setIllustrated(o: string, t: string, event: any) {
    const isIllustrious = event.srcElement.checked
    this.dict.definitions[t].properties[o].isIllustrated = isIllustrious
    const options = this.dict.definitions[t].properties[o].enum
    if (isIllustrious) {
      if (this.dict.definitions[t].properties[o].enum) {
        this.dict.definitions[t].properties[o].illustrations = this.dict.definitions[t].properties[o].enum.map((fm: string) => {
          return `/media/photologue/photos/cache/${fm}.png`
        })
      } else {
        this.dict.definitions[t].properties[o].illustrations = [`/media/photologue/photos/cache/image.png`]
      }
    } else {
      delete this.dict.definitions[t].properties[o].illustrations
    }
    //this.dict = JSON.parse(JSON.stringify(this.dict))
    this.save()
  }
  isRequired(t: string, o: string) {
    if (this.dict.definitions[t].properties[o].condition) {
      return this.dict.definitions[t].properties[o].isRequired
    } else {
      return this.dict.definitions[t].required.indexOf(o) >= 0
    }
  }
  setRequired(o: string, t: string, event: any) {
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
  resetDenominations(t: string) {
    this.dict.definitions[t].denominations = []
    this.save()
  }
  addDenomination(t: string, e: any) {
    if (!this.dict.definitions[t].denominations) this.dict.definitions[t].denominations = []
    if (e.srcElement.value && (e.srcElement.value.length)) {
      if (this.dict.definitions[t].denominations.indexOf(e.srcElement.value) < 0)
        this.dict.definitions[t].denominations.push(e.srcElement.value)
    }
    this.save()
  }
  newField(definition: any): void {
    let h: any = {};
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
    //this.dict = JSON.parse(JSON.stringify(this.dict))
  }
  deleteField(definition: any, fieldname: string) {
    if (confirm("Delete " + fieldname + "?")) {
      let h: any = {};
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
  moveFieldUpper(definition: any, fieldname: string) {
    let h: any = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    Object.entries(definition.properties).forEach(([key, v]) => {
      let value: any = v
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
  moveFieldToIndex(definition: any, fieldname: string) {
    let h: any = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    let x: any = ""
    while (!x?.match(/\d+/)) x = window.prompt("Index:")
    const intended: number = parseInt(x)
    let anterior = Object.entries(definition.properties).filter(([k, v]) => k == fieldname).map((v) => (v as any)[1]['propertyOrder']).pop()
    Object.entries(definition.properties).sort((a, b) => (a as any)['propertyOrder'] - (b as any)['propertyOrder']).forEach(([key, value]) => {
      let v = value as any
      if (!isNaN(v["propertyOrder"])) {
        if (key == fieldname) {
          v["propertyOrder"] = intended - 1
        } else {
          if (v["propertyOrder"] > anterior) {
            v["propertyOrder"]--
          }
          if (v["propertyOrder"] >= intended - 1) {
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
  moveFieldUp(definition: any, fieldname: string) {
    let h: any = {};
    let current_position = definition.properties[fieldname].propertyOrder - 1
    Object.entries(definition.properties).forEach(([key, v]) => {
      let value: any = v as any;
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
  moveFieldDown(definition: any, fieldname: string) {
    let h: any = {};
    let current_position = definition.properties[fieldname].propertyOrder + 1
    Object.entries(definition.properties).forEach(([key, v]) => {
      let value = v as any;
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
  moveFieldDowner(definition: any, fieldname: string) {
    let h: any = {};
    let current_position = definition.properties[fieldname].propertyOrder + 1
    Object.entries(definition.properties).forEach(([key, v]) => {
      let value = v as any;
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
  isNotLast(i: number, fieldset: any) {
    return Object.values(fieldset).length - 2 > i
  }


  deleteObject(o: any) {
    if (!confirm("Delete " + o.key + " permanently?"))
      return;
    let res: any = { "properties": {}, "definitions": {} };
    for (let key in this.dict.properties) {
      if (key != o.key) {
        res.properties[key] = this.dict.properties[key];
        res.definitions[key] = this.dict.definitions[key];
      }
    }
    this.set(res);
  }
  setPluralTitle(t: any, event: any) {
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
  moveup(item: any, caller: any = null) {
    var d = this.dict['definitions']
    let o = 0
    Object.keys(this.dict['definitions']).sort((a, b) => { return d[a]['propertyOrder'] - d[b]['propertyOrder'] }).forEach(k => {
      d[k]['propertyOrder'] = o;
      o++;
    })

    let current_position = item.value.propertyOrder - 1
    let res: any = { "properties": this.dict['properties'], "definitions": {} };
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

  movedown(item: any) {
    var d = this.dict['definitions']
    let o = 0;
    Object.keys(this.dict['definitions']).sort((a, b) => { return d[a]['propertyOrder'] - d[b]['propertyOrder'] }).forEach(k => {
      d[k]['propertyOrder'] = o;
      o++;
    })

    let current_position = this.dict.definitions[item.key].propertyOrder + 1
    let res: any = { "properties": this.dict['properties'], "definitions": {} };

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
  isLast(i: number) {
    return i < Object.values(this.dict.properties).length - 1
  }
  save() {
    this.fixRequired()
    const b = { "definitions": this.dict.definitions, "properties": this.dict.properties }
    this.dict_json = JSON.stringify(b) || "{}"
    //this.dict.properties=(b&&b.properties)?JSON.parse(JSON.stringify(b.properties)):{}
    //this.dict.definitions=(b&&b.definitions)?JSON.parse(JSON.stringify(b.definitions)):{}
  }
  setDetails(eve: any, element: any, key: string) {
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
  getCountables(p: any) {
    if (this.dict && this.dict['definitions']) {
      return Object.keys(this.dict['definitions']).filter((k) => {
        return (k != p) && this.dict['definitions'][k].multiple
      }).map((k) => {
        return { key: k, title: this.dict['definitions'][k]['title'] }
      })
    }
    return []
  }
  setCountable(table: string, field: string, eve: any) {
    this.dict['definitions'][table]['properties'][field].counted = eve.srcElement.value
    this.save()
  }
  getCountedFields(table: string) {
    if (this.dict['definitions'][table]) {
      return Object.keys(this.dict['definitions'][table].properties).filter((k) => k != "_localId")
    }
    return []
  }
  setCountableFilter(table: string, field: string, eve: any) {
    this.dict['definitions'][table]['properties'][field].countedFilter = eve.srcElement.value
    this.save()
  }
  setCountedFilterRegex(table: string, field: string, eve: any) {
    this.dict['definitions'][table]['properties'][field].countedFilterRegex = eve.srcElement.value
    this.save()
  }
  expandProp(event: any) {
    let e = event.srcElement
    if (e.className != "name") return
    while (!e.className.match(/properties/)) e = e.parentNode
    const d = e.className.match(/expanded/)
    Array.from(document.getElementsByClassName('properties')).forEach((l) => l.className = "properties")
    if (!d) e.className = "properties expanded"
  }
  sortedHash(item: any): any {
    let keys = [];
    if (!this.dict) return
    if (!this.dict.definitions) return
    if (!this.dict.definitions[item.key]) return
    let value = this.dict.definitions[item.key].properties
    for (let key in value) {
      if (value[key].options && value[key].options.hidden == true) {
      } else {
        keys.push(key);
      }
    }
    keys.sort((n1, n2) => {
      if (value[n1].propertyOrder > value[n2].propertyOrder) {
        return 1;
      }
      if (value[n1].propertyOrder < value[n2].propertyOrder) {
        return -1;
      }
      return 0;
    })
    return keys.map(k => ({ key: k, value: value[k] }));
  }
  filteredSortedHash(item: any, filter: any): any {
    let keys = [];
    let value = this.dict.definitions[item.key].properties
    for (let key in value) {
      if (value[key].options && value[key].options.hidden == true) {
      } else {
        keys.push(key);
      }
    }
    keys.sort((n1, n2) => {
      if (value[n1].propertyOrder > value[n2].propertyOrder) {
        return 1;
      }
      if (value[n1].propertyOrder < value[n2].propertyOrder) {
        return -1;
      }
      return 0;
    })
    return keys.map(k => ({ key: k, value: value[k] })).filter((fu: any) => {
      return (fu["key"] != filter[0]) && (fu["value"].fieldType && (fu["value"].fieldType == "selectlist"))
    });
  }
  getSortedDefinitions() {
    let keys = [];
    let value = this.dict.definitions
    for (let key in value) {
      if (value[key].options && value[key].options.hidden == true) {
      } else {
        keys.push(key);
      }
    }
    keys.sort((n1, n2) => {
      if (value[n1].propertyOrder > value[n2].propertyOrder) {
        return 1;
      }
      if (value[n1].propertyOrder < value[n2].propertyOrder) {
        return -1;
      }
      return 0;
    })
    return keys.map(k => ({ key: k, value: value[k] }));
  }
}
