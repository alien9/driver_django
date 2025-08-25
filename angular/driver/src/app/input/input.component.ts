import { Component, OnInit, Input, NgZone, Output, EventEmitter, ApplicationRef, TemplateRef, ViewChild } from '@angular/core'
import * as L from 'leaflet'
import { environment } from '../../environments/environment'
import { WebService } from '../web.service'
import { first } from 'rxjs/operators';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { RecordService } from '../record.service'
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { NgxSpinnerService } from "ngx-spinner";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { getLocaleDirection } from '@angular/common';

import * as uuid from 'uuid';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { of, OperatorFunction } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import "leaflet.vectorgrid";
import "leaflet.locatecontrol";
//import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit {
  @Input() record: object
  @Input() recordSchema: object
  @Input() config: object
  @Input() editing: boolean
  @Input() modal: any
  @Input() locale: string
  @Input() roadmap_uuid: string
  @Output() mapillaryId = new EventEmitter<string>()
  @Output() reloadRecords = new EventEmitter<object>()
  @Output() filterExpand = new EventEmitter<Date>()
  @Output() storeRecord = new EventEmitter<object>()
  @Output() stopEditRecord = new EventEmitter<boolean>()
  @Output() refreshLocalRecords = new EventEmitter<boolean>()
  @Input() boundaries: any
  @ViewChild("nav") nav;
  public schema: object
  public options: any
  public layersControl: any
  public layers: any
  public edit: boolean = false
  private marker: L.marker
  private map: L.Map
  public selectedBoundaries: any = []
  public autocomplete_terms: any[] = []
  public isDrawing = false
  public fontFamily = document.body.style.fontFamily
  backend: string
  latitude: number
  longitude: number
  occurred_date_ngb: NgbDateStruct
  occurred_time: any
  timezone: string = "null"

  weatherValues = [
    '',
    'clear-day',
    'clear-night',
    'cloudy',
    'fog',
    'hail',
    'partly-cloudy-day',
    'partly-cloudy-night',
    'rain',
    //'sleet',
    //'snow',
    'thunderstorm',
    //'tornado',
    'wind'
  ]
  lightValues = [
    'dawn', 'day', 'dusk', 'night'
  ]
  geocoding = false
  geocodeFailed = false
  commentCanvas: any;
  previousMousePosition = { x: 0, y: 0 }
  currentMousePosition = { x: 0, y: 0 };
  imageEditing: any;
  hasRoadMap: boolean = false
  reverse_trans: {};
  canvas_extra: any = null;
  accordionOpenedItem: any;
  isFirstNavItem: boolean = true;
  isLastNavItem: boolean = true;
  firstNavItem: string;
  lastNavItem: string;
  roadmapsLayer: any;
  previousBounds: string;
  direction: string;
  saving: boolean = false;
  today: object;
  TIMEZONES = [
    "Africa/Abidjan",
    "Africa/Accra",
    "Africa/Addis_Ababa",
    "Africa/Algiers",
    "Africa/Asmera",
    "Africa/Bamako",
    "Africa/Bangui",
    "Africa/Banjul",
    "Africa/Bissau",
    "Africa/Blantyre",
    "Africa/Brazzaville",
    "Africa/Bujumbura",
    "Africa/Cairo",
    "Africa/Casablanca",
    "Africa/Ceuta",
    "Africa/Conakry",
    "Africa/Dakar",
    "Africa/Dar_es_Salaam",
    "Africa/Djibouti",
    "Africa/Douala",
    "Africa/El_Aaiun",
    "Africa/Freetown",
    "Africa/Gaborone",
    "Africa/Harare",
    "Africa/Johannesburg",
    "Africa/Juba",
    "Africa/Kampala",
    "Africa/Khartoum",
    "Africa/Kigali",
    "Africa/Kinshasa",
    "Africa/Lagos",
    "Africa/Libreville",
    "Africa/Lome",
    "Africa/Luanda",
    "Africa/Lubumbashi",
    "Africa/Lusaka",
    "Africa/Malabo",
    "Africa/Maputo",
    "Africa/Maseru",
    "Africa/Mbabane",
    "Africa/Mogadishu",
    "Africa/Monrovia",
    "Africa/Nairobi",
    "Africa/Ndjamena",
    "Africa/Niamey",
    "Africa/Nouakchott",
    "Africa/Ouagadougou",
    "Africa/Porto-Novo",
    "Africa/Sao_Tome",
    "Africa/Tripoli",
    "Africa/Tunis",
    "Africa/Windhoek",
    "America/Adak",
    "America/Anchorage",
    "America/Anguilla",
    "America/Antigua",
    "America/Araguaina",
    "America/Argentina/La_Rioja",
    "America/Argentina/Rio_Gallegos",
    "America/Argentina/Salta",
    "America/Argentina/San_Juan",
    "America/Argentina/San_Luis",
    "America/Argentina/Tucuman",
    "America/Argentina/Ushuaia",
    "America/Aruba",
    "America/Asuncion",
    "America/Bahia",
    "America/Bahia_Banderas",
    "America/Barbados",
    "America/Belem",
    "America/Belize",
    "America/Blanc-Sablon",
    "America/Boa_Vista",
    "America/Bogota",
    "America/Boise",
    "America/Buenos_Aires",
    "America/Cambridge_Bay",
    "America/Campo_Grande",
    "America/Cancun",
    "America/Caracas",
    "America/Catamarca",
    "America/Cayenne",
    "America/Cayman",
    "America/Chicago",
    "America/Chihuahua",
    "America/Ciudad_Juarez",
    "America/Coral_Harbour",
    "America/Cordoba",
    "America/Costa_Rica",
    "America/Creston",
    "America/Cuiaba",
    "America/Curacao",
    "America/Danmarkshavn",
    "America/Dawson",
    "America/Dawson_Creek",
    "America/Denver",
    "America/Detroit",
    "America/Dominica",
    "America/Edmonton",
    "America/Eirunepe",
    "America/El_Salvador",
    "America/Fort_Nelson",
    "America/Fortaleza",
    "America/Glace_Bay",
    "America/Godthab",
    "America/Goose_Bay",
    "America/Grand_Turk",
    "America/Grenada",
    "America/Guadeloupe",
    "America/Guatemala",
    "America/Guayaquil",
    "America/Guyana",
    "America/Halifax",
    "America/Havana",
    "America/Hermosillo",
    "America/Indiana/Knox",
    "America/Indiana/Marengo",
    "America/Indiana/Petersburg",
    "America/Indiana/Tell_City",
    "America/Indiana/Vevay",
    "America/Indiana/Vincennes",
    "America/Indiana/Winamac",
    "America/Indianapolis",
    "America/Inuvik",
    "America/Iqaluit",
    "America/Jamaica",
    "America/Jujuy",
    "America/Juneau",
    "America/Kentucky/Monticello",
    "America/Kralendijk",
    "America/La_Paz",
    "America/Lima",
    "America/Los_Angeles",
    "America/Louisville",
    "America/Lower_Princes",
    "America/Maceio",
    "America/Managua",
    "America/Manaus",
    "America/Marigot",
    "America/Martinique",
    "America/Matamoros",
    "America/Mazatlan",
    "America/Mendoza",
    "America/Menominee",
    "America/Merida",
    "America/Metlakatla",
    "America/Mexico_City",
    "America/Miquelon",
    "America/Moncton",
    "America/Monterrey",
    "America/Montevideo",
    "America/Montserrat",
    "America/Nassau",
    "America/New_York",
    "America/Nome",
    "America/Noronha",
    "America/North_Dakota/Beulah",
    "America/North_Dakota/Center",
    "America/North_Dakota/New_Salem",
    "America/Ojinaga",
    "America/Panama",
    "America/Paramaribo",
    "America/Phoenix",
    "America/Port-au-Prince",
    "America/Port_of_Spain",
    "America/Porto_Velho",
    "America/Puerto_Rico",
    "America/Punta_Arenas",
    "America/Rankin_Inlet",
    "America/Recife",
    "America/Regina",
    "America/Resolute",
    "America/Rio_Branco",
    "America/Santarem",
    "America/Santiago",
    "America/Santo_Domingo",
    "America/Sao_Paulo",
    "America/Scoresbysund",
    "America/Sitka",
    "America/St_Barthelemy",
    "America/St_Johns",
    "America/St_Kitts",
    "America/St_Lucia",
    "America/St_Thomas",
    "America/St_Vincent",
    "America/Swift_Current",
    "America/Tegucigalpa",
    "America/Thule",
    "America/Tijuana",
    "America/Toronto",
    "America/Tortola",
    "America/Vancouver",
    "America/Whitehorse",
    "America/Winnipeg",
    "America/Yakutat",
    "Antarctica/Casey",
    "Antarctica/Davis",
    "Antarctica/DumontDUrville",
    "Antarctica/Macquarie",
    "Antarctica/Mawson",
    "Antarctica/McMurdo",
    "Antarctica/Palmer",
    "Antarctica/Rothera",
    "Antarctica/Syowa",
    "Antarctica/Troll",
    "Antarctica/Vostok",
    "Arctic/Longyearbyen",
    "Asia/Aden",
    "Asia/Almaty",
    "Asia/Amman",
    "Asia/Anadyr",
    "Asia/Aqtau",
    "Asia/Aqtobe",
    "Asia/Ashgabat",
    "Asia/Atyrau",
    "Asia/Baghdad",
    "Asia/Bahrain",
    "Asia/Baku",
    "Asia/Bangkok",
    "Asia/Barnaul",
    "Asia/Beirut",
    "Asia/Bishkek",
    "Asia/Brunei",
    "Asia/Calcutta",
    "Asia/Chita",
    "Asia/Colombo",
    "Asia/Damascus",
    "Asia/Dhaka",
    "Asia/Dili",
    "Asia/Dubai",
    "Asia/Dushanbe",
    "Asia/Famagusta",
    "Asia/Gaza",
    "Asia/Hebron",
    "Asia/Hong_Kong",
    "Asia/Hovd",
    "Asia/Irkutsk",
    "Asia/Jakarta",
    "Asia/Jayapura",
    "Asia/Jerusalem",
    "Asia/Kabul",
    "Asia/Kamchatka",
    "Asia/Karachi",
    "Asia/Katmandu",
    "Asia/Khandyga",
    "Asia/Krasnoyarsk",
    "Asia/Kuala_Lumpur",
    "Asia/Kuching",
    "Asia/Kuwait",
    "Asia/Macau",
    "Asia/Magadan",
    "Asia/Makassar",
    "Asia/Manila",
    "Asia/Muscat",
    "Asia/Nicosia",
    "Asia/Novokuznetsk",
    "Asia/Novosibirsk",
    "Asia/Omsk",
    "Asia/Oral",
    "Asia/Phnom_Penh",
    "Asia/Pontianak",
    "Asia/Pyongyang",
    "Asia/Qatar",
    "Asia/Qostanay",
    "Asia/Qyzylorda",
    "Asia/Rangoon",
    "Asia/Riyadh",
    "Asia/Saigon",
    "Asia/Sakhalin",
    "Asia/Samarkand",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Srednekolymsk",
    "Asia/Taipei",
    "Asia/Tashkent",
    "Asia/Tbilisi",
    "Asia/Tehran",
    "Asia/Thimphu",
    "Asia/Tokyo",
    "Asia/Tomsk",
    "Asia/Ulaanbaatar",
    "Asia/Urumqi",
    "Asia/Ust-Nera",
    "Asia/Vientiane",
    "Asia/Vladivostok",
    "Asia/Yakutsk",
    "Asia/Yekaterinburg",
    "Asia/Yerevan",
    "Atlantic/Azores",
    "Atlantic/Bermuda",
    "Atlantic/Canary",
    "Atlantic/Cape_Verde",
    "Atlantic/Faeroe",
    "Atlantic/Madeira",
    "Atlantic/Reykjavik",
    "Atlantic/South_Georgia",
    "Atlantic/St_Helena",
    "Atlantic/Stanley",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Broken_Hill",
    "Australia/Darwin",
    "Australia/Eucla",
    "Australia/Hobart",
    "Australia/Lindeman",
    "Australia/Lord_Howe",
    "Australia/Melbourne",
    "Australia/Perth",
    "Australia/Sydney",
    "Europe/Amsterdam",
    "Europe/Andorra",
    "Europe/Astrakhan",
    "Europe/Athens",
    "Europe/Belgrade",
    "Europe/Berlin",
    "Europe/Bratislava",
    "Europe/Brussels",
    "Europe/Bucharest",
    "Europe/Budapest",
    "Europe/Busingen",
    "Europe/Chisinau",
    "Europe/Copenhagen",
    "Europe/Dublin",
    "Europe/Gibraltar",
    "Europe/Guernsey",
    "Europe/Helsinki",
    "Europe/Isle_of_Man",
    "Europe/Istanbul",
    "Europe/Jersey",
    "Europe/Kaliningrad",
    "Europe/Kiev",
    "Europe/Kirov",
    "Europe/Lisbon",
    "Europe/Ljubljana",
    "Europe/London",
    "Europe/Luxembourg",
    "Europe/Madrid",
    "Europe/Malta",
    "Europe/Mariehamn",
    "Europe/Minsk",
    "Europe/Monaco",
    "Europe/Moscow",
    "Europe/Oslo",
    "Europe/Paris",
    "Europe/Podgorica",
    "Europe/Prague",
    "Europe/Riga",
    "Europe/Rome",
    "Europe/Samara",
    "Europe/San_Marino",
    "Europe/Sarajevo",
    "Europe/Saratov",
    "Europe/Simferopol",
    "Europe/Skopje",
    "Europe/Sofia",
    "Europe/Stockholm",
    "Europe/Tallinn",
    "Europe/Tirane",
    "Europe/Ulyanovsk",
    "Europe/Vaduz",
    "Europe/Vatican",
    "Europe/Vienna",
    "Europe/Vilnius",
    "Europe/Volgograd",
    "Europe/Warsaw",
    "Europe/Zagreb",
    "Europe/Zurich",
    "Indian/Antananarivo",
    "Indian/Chagos",
    "Indian/Christmas",
    "Indian/Cocos",
    "Indian/Comoro",
    "Indian/Kerguelen",
    "Indian/Mahe",
    "Indian/Maldives",
    "Indian/Mauritius",
    "Indian/Mayotte",
    "Indian/Reunion",
    "Pacific/Apia",
    "Pacific/Auckland",
    "Pacific/Bougainville",
    "Pacific/Chatham",
    "Pacific/Easter",
    "Pacific/Efate",
    "Pacific/Enderbury",
    "Pacific/Fakaofo",
    "Pacific/Fiji",
    "Pacific/Funafuti",
    "Pacific/Galapagos",
    "Pacific/Gambier",
    "Pacific/Guadalcanal",
    "Pacific/Guam",
    "Pacific/Honolulu",
    "Pacific/Kiritimati",
    "Pacific/Kosrae",
    "Pacific/Kwajalein",
    "Pacific/Majuro",
    "Pacific/Marquesas",
    "Pacific/Midway",
    "Pacific/Nauru",
    "Pacific/Niue",
    "Pacific/Norfolk",
    "Pacific/Noumea",
    "Pacific/Pago_Pago",
    "Pacific/Palau",
    "Pacific/Pitcairn",
    "Pacific/Ponape",
    "Pacific/Port_Moresby",
    "Pacific/Rarotonga",
    "Pacific/Saipan",
    "Pacific/Tahiti",
    "Pacific/Tarawa",
    "Pacific/Tongatapu",
    "Pacific/Truk",
    "Pacific/Wake",
    "Pacific/Wallis"
  ]
  constructor(
    private webService: WebService,
    private zone: NgZone,
    private recordService: RecordService,
    private spinner: NgxSpinnerService,
    private translateService: TranslateService,
    private readonly applicationRef: ApplicationRef,
    private modalService: NgbModal,

  ) { }
  formatAddress(address: any) {
    let lt = []
    if (address && address['address']) {
      if (address['address']['road']) lt.push(address['address']['road'])
      if (address['address']['city']) lt.push(address['address']['city'])
      if (address['address']['village']) lt.push(address['address']['village'])
      if (address['address']['county']) lt.push(address['address']['county'])
      if (address['address']['state']) lt.push(address['address']['state'])
    }
    return lt.join(", ")
  }
  ngOnInit(): void {
    let d = new Date()
    this.timezone = this.record['timezone']
    if (!this.timezone || (this.timezone == "")) this.timezone = this.config['TIMEZONE']
    this.today = { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() }
    this.schema = this.recordSchema['schema']
    this.direction = getLocaleDirection(localStorage.getItem("Language"))
    const defs = Object.keys(this.schema['definitions']).sort((a, b) => this.schema['definitions'][a].propertyOrder - this.schema['definitions'][b].propertyOrder)
    this.lastNavItem = defs[defs.length - 1]
    this.firstNavItem = defs[0]
    this.isLastNavItem = defs.length < 2
    this.isFirstNavItem = true

    let str = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>",
        detectRetina: false,
        zIndex: 1
      })
    let str_nolabel = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
      {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors, &copy; <a href='https://cartodb.com/attributions'>CartoDB</a>",
        detectRetina: false,
        zIndex: 1
      })
    let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    let sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {});
    this.backend = localStorage.getItem("backend") || (('api' in environment) ? environment.api : '')
    this.layersControl = {
      baseLayers: {
        'CartoDB': str,
        'No Labels': str_nolabel,
        'Open Street Map': osm,
        'Satellite Map': sat
      },
      overlays: {
      }
    }

    if (!!window['android']) {
      this.roadmapsLayer = new L.geoJSON()
      this.layersControl.baseLayers["Local Road Map"] = new L.LayerGroup([this.roadmapsLayer])
      window['showLocalRoads'] = (e: any) => {
        this.roadmapsLayer = e
        this.layersControl.baseLayers["Local Road Map"].clearLayers()
        this.layersControl.baseLayers["Local Road Map"].addLayer(this.roadmapsLayer)
      }
    }

    let light = this.record['light']
    if (!light && this.record['geom'].coordinates) {
      this.record['light'] = this.getLight(this.record['geom'].coordinates, new Date(this.record['occurred_from']))
    }

    if (this.record['geom'].coordinates && !this.record['location_text']) {
      this.webService.getReverse(this.record['geom'].coordinates[1], this.record['geom'].coordinates[0]).pipe(first()).subscribe(address => {
        this.record['location_text'] = this.formatAddress(address)
      })
    }

    let du = new Date(this.record['occurred_from'])

    this.occurred_date_ngb = this.asNgbDateStruct(du)
    this.occurred_time = {
      hour: parseInt(du.toLocaleTimeString('en', { timeZone: this.timezone, hour: '2-digit', hour12: false })),
      minute: parseInt(du.toLocaleTimeString('en', { timeZone: this.timezone, minute: '2-digit' })),
      second: 0
    }
    let c = this.record['geom'].coordinates
    let latlng = new L.latLng([c[1], c[0]])
    this.setMarker(latlng)
    if (!this.record['weather'] && (this.config['OPENWEATHER_RAPID_KEY']) && this.config['OPENWEATHER_RAPID_KEY'].length) {
      this.webService.getHistoryWeather({ lat: c[1], lon: c[0], appid: this.config['OPENWEATHER_RAPID_KEY'] })
        .pipe(first()).subscribe(weatherData => {
          if (weatherData['current'] && weatherData['current']['weather'] && weatherData['current']['weather'].length)
            this.record['weather'] = weatherData['current']['weather']['description']
        })
    }
    this.recordService.getBoundaryPolygons(null, `${c[0]} ${c[1]}`).subscribe((d) => {
      let h = {}
      d['results'].forEach((l) => {
        h[l.boundary] = l.data
      })
      this.selectedBoundaries = this.boundaries.map((b) => {
        let t = h[b.uuid] && (h[b.uuid][localStorage.getItem("Language")] || h[b.uuid][b.display_field])
        return {
          "label": this.translateService.instant(b.label),
          "value": t
        }
      }).filter((o) => o.value && o.value.length > 0)
    })

    let bl = localStorage.getItem("input_baselayer") || 'CartoDB'
    if (this.layersControl.baseLayers[bl])
      this.layers = [this.layersControl.baseLayers[bl]]
    else
      this.layers = [str]
    this.options = {
      layers: this.layers
    }

    this.options = {
      layers: this.layers,
      zoom: 17,
      center: latlng
    }
    $(window).trigger('resize');
    let mapillary
    if (this.record['mapillary'] && this.record['mapillary'].length) {
      try {
        mapillary = JSON.parse(this.record['mapillary'])
        this.layersControl.overlays['Mapillary'] = L.layerGroup()
        this.options.layers.push(this.layersControl.overlays['Mapillary'])
        this.loadMapillary(mapillary)
      } catch (error) {
        console.log("Mapillary parse Error")
      }
    }
    if (!mapillary && this.config['MAPILLARY_TOKEN']) {
      let c = this.record['geom'].coordinates
      this.webService.getMapillaryImages(this.config['MAPILLARY_TOKEN'], `${c[0] - 0.005},${c[1] - 0.0015},${c[0] + 0.005},${c[1] + 0.0015}`).pipe(first()).subscribe(imagery => {
        //this.record['mapillary'] = JSON.stringify(imagery)
        this.layersControl.overlays['Mapillary'] = L.layerGroup()
        this.options.layers.push(this.layersControl.overlays['Mapillary'])
        this.loadMapillary(imagery)
      })
    }
  }

  loadMapillary(imagery: any) {
    imagery['data'].forEach(img => {
      let l = new L.CircleMarker(img.geometry['coordinates'].reverse(), {
        radius: 5,
        stroke: false,
        fillColor: '#009933',
        fillOpacity: 0.3
      }).on('click', (e) => {
        e.sourceTarget.setStyle({ 'fillColor': "#ff0000", fillOpacity: 1 })
        this.zone.run(() => {
          this.setMapillaryId(img.id)
          this.layersControl.overlays['Mapillary'].getLayers().filter(k => k != e.sourceTarget).forEach(l => {
            l.setStyle({ 'fillColor': "#009933", fillOpacity: 0.3 })
          })
        })
      })
      this.layersControl.overlays['Mapillary'].addLayer(l)
    })
  }
  asNgbDateStruct(date: Date) {
    return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }
  }
  cleanup() {
    Object.keys(this.record['data']).forEach((k) => {
      let change = this.record['data'][k]
      this.record['schema'] = this.recordSchema['uuid']
      if (this.recordSchema['schema'].definitions[k]) {
        if (!this.recordSchema['schema'].definitions[k].multiple) {
          change = [this.record['data'][k]]
          Object.keys(this.recordSchema['schema'].definitions[k].properties).forEach((ko) => {
            if (this.recordSchema['schema'].definitions[k].properties[ko].fieldType == 'counter') {
              let fu = this.recordSchema['schema'].definitions[k].properties[ko]
              let cn = "0"
              if (fu.counted && this.record['data'][fu.counted]) {
                if (fu.countedFilter && fu.countedFilterRegex) {
                  cn = this.record['data'][fu.counted].filter((kk) => {
                    if (kk[fu.countedFilter] && kk[fu.countedFilter].match(new RegExp(fu.countedFilterRegex)))
                      return true
                  }).length.toString()
                } else {
                  cn = Object.keys(this.record['data'][fu.counted]).length.toString()
                }
              }
              this.record['data'][k][ko] = cn
            }
          })
        }
        for (let i = 0; i < change.length; i++) {
          Object.keys(this.recordSchema['schema'].definitions[k].properties).forEach((l) => {
            let t = this.recordSchema['schema'].definitions[k].properties[l].type
            switch (t) {
              case 'integer':
                if (!isNaN(parseInt(change[i][l]))) {
                  change[i][l] = parseInt(change[i][l])
                } else {
                  delete change[i][l]
                }
                break;
              case 'number':
                if (!isNaN(parseFloat(change[i][l]))) {
                  change[i][l] = parseFloat(change[i][l])
                } else {
                  delete change[i][l]
                }
                break;
              case 'string':
                if (this.recordSchema['schema'].definitions[k].properties[l].format == 'time') {
                  if (!change[i][l]?.match(/\d+:\d+/)) {
                    delete change[i][l]
                  }
                }
                if (change[i][l] == '') delete change[i][l]
                break;
              default:
                if (change[i][l] == '') delete change[i][l]
            }
          })
        }
      }
    })
  }
  validateRecord(): boolean {
    let v = true
    const isRequired = this.translateService.instant('is required');
    if (typeof this.record['location_text'] == 'object') {
      this.record['location_text'] = this.formatAddress(this.record['location_text'])
    }
    Object.keys(this.recordSchema["schema"].definitions).sort((a, b) => this.recordSchema["schema"].definitions[a]["propertyOrder"] - this.recordSchema["schema"].definitions[b]["propertyOrder"]).forEach((kk) => {
      if (this.recordSchema["schema"].definitions[kk].required) {
        let requiredFields = Object.keys(this.recordSchema["schema"].definitions[kk].properties).filter((pk) => {
          return this.recordSchema["schema"].definitions[kk].properties[pk].isRequired || this.recordSchema["schema"].definitions[kk].required.includes(pk)
        }).sort((a, b) => {
          return this.recordSchema["schema"].definitions[kk].properties[a]["propertyOrder"] - this.recordSchema["schema"].definitions[kk].properties[b]["propertyOrder"]
        })
        requiredFields.forEach((reqs) => {
          if (reqs == "_localId") return
          let condition = this.recordSchema["schema"].definitions[kk].properties[reqs].condition
          if (v) {
            if (!this.recordSchema["schema"].definitions[kk].multiple) {
              if (condition) {
                if (!this.record["data"][kk][condition]) return
                if (!this.record["data"][condition]) return
                if (this.recordSchema["schema"].definitions[kk].properties[reqs].conditionRegex) {
                  if (!this.record["data"][condition].match(new RegExp(this.recordSchema["schema"].definitions[kk].properties[reqs].conditionRegex))) return
                } else {
                  if (this.record["data"][condition] != this.recordSchema["schema"].definitions[kk].properties[reqs].conditionValue) return
                }
              }
              if (this.record["data"][kk][reqs] === undefined || this.record["data"][kk][reqs] === null || this.record["data"][kk][reqs] === '') {
                this.nav.select(kk)
                const fieldId = `${kk}_${reqs}_-1`.replace(/[^\w]/g, "_")
                alert(`${this.translateService.instant(reqs)} ${isRequired}`)
                setTimeout(() => {
                  $(`#${fieldId}`).focus()
                }, 500)
                v = false
              }
            } else { //multiple
              if (kk in this.record["data"]) {
                this.record["data"][kk].forEach((vei, j) => {
                  if (condition) {
                    if (!vei[condition]) return
                    if (this.recordSchema["schema"].definitions[kk].properties[reqs].conditionRegex) {
                      if (!vei[condition].match(new RegExp(this.recordSchema["schema"].definitions[kk].properties[reqs].conditionRegex))) return
                    } else {
                      if (vei[condition] != this.recordSchema["schema"].definitions[kk].properties[reqs].conditionValue) return
                    }
                  }
                  if (vei[reqs] === undefined || vei === null || vei[reqs] === '') {
                    this.nav.select(kk)
                    this.accordionOpenedItem = j
                    const reqfieldId = `${kk}_${reqs}_${j}`.replace(/[^\w]/g, "_")
                    alert(`${this.translateService.instant(reqs)} ${isRequired}`)
                    setTimeout(() => {
                      $(`#${reqfieldId}`).focus()
                    }, 500)
                    v = false
                    return
                  }
                })
              }
            }
          }
        })
      }
    })
    return v
  }
  isRequired(table, field) {
    return this.recordSchema["schema"].definitions[table].properties[field].isRequired || (this.recordSchema["schema"].definitions[table].required.indexOf(field) >= 0)
  }
  isUntitled(table, field) {
    return this.recordSchema["schema"].definitions[table].properties[field].isUntitled
  }
  getDenominations(t, idx) {
    const names = []
    if (!t.value.denominations) {
      return this.translateService.instant(t.value.title)
    }
    let i = 0
    while (i < t.value.denominations.length && names.length < 2) {
      if (t.value.denominations.length > i && t.value.denominations[i].length)
        if (idx >= 0) {
          if (this.record["data"][t.key][idx][t.value.denominations[i]])
            names.push(this.translateService.instant(this.record["data"][t.key][idx][t.value.denominations[i]]))
        } else {
          if (this.record["data"][t.key][t.value.denominations[i]])
            names.push(this.translateService.instant(this.record["data"][t.key][t.value.denominations[i]]))

        }
      i++
    }
    if (names.length) return names.join(" ")
    return this.translateService.instant(t.value.title)

  }
  saveRecord(modal: any) {
    if (this.saving) return
    this.saving = true
    this.setDate(null)
    this.spinner.show()
    this.cleanup()
    if (!this.validateRecord()) {
      this.spinner.hide()
      this.saving = false
      return
    }
    this.recordService.upload(this.record).pipe(first()).subscribe({
      next: data => {
        this.stopEditRecord.emit(true)
        this.filterExpand.emit(this.record['occurred_from'])
        this.reloadRecords.emit(this.record)
        this.saving = false
        this.spinner.hide()
      }, error: err => {
        let message = err["error"]
        if ("detail" in message) {
          alert(message["detail"])
        }
        else if ("data" in message) {
          let m = message["data"]
          let mess = m.match(/Schema validation failed for (.+): '(.+)' is a required property/)
          if (mess && mess.length == 3) {
            alert(`${this.translateService.instant("Schema validation failed for")} ${this.translateService.instant(mess[1])}: ${this.translateService.instant(mess[2])} ${this.translateService.instant("is a required property")}`)
          } else {
            alert(message["data"])
          }
        }
        else if ("occurred_from" in message) {
          alert(message["occurred_from"])
        }
        else {
          let records = JSON.parse(localStorage.getItem("records") || "[]")
          records = records.filter((o) => o['uuid'] != this.record['uuid'])
          records.push(this.record)
          localStorage.setItem("records", JSON.stringify(records))
          this.storeRecord.emit(records)
          alert(this.translateService.instant('Record was stored in the device'))
          modal.dismiss()
          this.spinner.hide()
        }
        this.spinner.hide()
        this.saving = false
      }
    })
  }
  deleteRecord(modal: any) {
    this.setDate(null)
    this.cleanup()
    this.spinner.show()
    this.record['archived'] = true
    if (this.record['uuid']) {
      this.recordService.upload(this.record).pipe(first()).subscribe({
        next: data => {
          this.reloadRecords.emit(this.record)
          modal.dismiss()
          this.spinner.hide()

        }, error: err => {
          console.log(err)
          this.spinner.hide()
        }
      })
    } else {
      this.refreshLocalRecords.emit(true)
      modal.dismiss()
      this.spinner.hide()
    }
  }
  setMap(e: L.Map) {
    this.map = e
    L.control.locate({ drawMarker: false }).addTo(this.map)
  }

  setMapillaryId(id: string) {
    this.mapillaryId.emit(id)
  }
  setMarker(latlng: L.latlng) {
    this.marker = L.marker(latlng, {
      icon: L.icon({
        iconSize: [25, 45],
        iconAnchor: [13, 45],
        iconUrl: 'assets/marker-icon-2x.png',
      }),
      draggable: true,
    }).on('dragend', (e) => {
      if (!this.editing) {
        let c = this.record['geom'].coordinates
        let latlng = new L.latLng(c[1], c[0])
        if (latlng) {
          this.marker.remove()
          this.setMarker(latlng)
          this.marker.addTo(this.map)
        }
      } else {
        this.zone.run(() => {
          this.webService.getReverse(e.target.getLatLng().lat, e.target.getLatLng().lng).pipe(first()).subscribe(address => {
            if (address && address['address']) {
              let lt = []
              if (address['address']['road']) lt.push(address['address']['road'])
              if (address['address']['city']) lt.push(address['address']['city'])
              if (address['address']['village']) lt.push(address['address']['village'])
              if (address['address']['county']) lt.push(address['address']['county'])
              if (address['address']['state']) lt.push(address['address']['state'])
              this.record['location_text'] = lt.join(", ")
            }
          })
          this.record['geom'] = { "type": "Point", "coordinates": [e.target.getLatLng().lng, e.target.getLatLng().lat] }
        })
      }
    })

  }
  mapReady(e: L.Map) {
    this.map = e
    if (this.marker)
      this.marker.addTo(this.map)
    setTimeout(function () {
      e.invalidateSize();
    }, 10);
    e.on('overlayadd', e => {
    })
    e.on('baselayerchange', l => {
      localStorage.setItem("input_baselayer", l.name)
    })
    e.on("viewreset", this.viewReset)
    e.on("moveend", this.viewReset)
    e.on("zoomend", this.viewReset)
    this.setMap(e)
  }
  tabChange(e: any) {
    if (this.schema['definitions'][e.nextId]['details']) {// it's returning to the map pane
      setTimeout(function () {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
    this.isFirstNavItem = e.nextId == this.firstNavItem
    this.isLastNavItem = e.nextId == this.lastNavItem
  }
  getLight(c, d) {
    let light = 'day'
    let sunrise = getSunrise(c[1], c[0], d).getTime()
    if (Math.abs(sunrise - d.getTime()) < 3600000) {
      light = 'dawn'
    } else {
      let sunset = getSunset(c[1], c[0], d).getTime()
      if (Math.abs(sunset - d.getTime()) < 3600000) {
        light = 'dusk'
      } else {
        if ((d.getTime() < sunrise) || (d.getTime() > sunset)) light = 'night'
      }
    }
    return light
  }
  closeModal(m: any) {
    this.mapillaryId.emit(null)
    m.close('Cancel')
  }
  addElement(what: string) {
    let o = { '_localId': uuid.v4() }
    if (!this.record['data'][what]) this.record['data'][what] = []
    this.record['data'][what].push(o)
    this.setAccordionOpen(this.record['data'][what].length - 1)
  }
  removeElement(what: string, i: number) {
    this.record['data'][what] = this.record['data'][what].filter((e: string, n: number) => n != i)
  }
  setDateField(e: any, table: string, field: string, index: number = -1) {
    let d = null
    if (e) {
      d = new Date()
      d.setFullYear(e['year'], e['month'] - 1, e['day'])
    }
    if (index < 0) {
      this.record['data'][table][field] = d
    } else {
      this.record['data'][table][index][field] = d
    }
  }
  setInputDateField(e: any) {
    if (e.index < 0) {
      this.record['data'][e.table][e.field] = e.value
    } else {
      this.record['data'][e.table][e.index][e.field] = e.value
    }
  }
  setDate(e: any) {
    this.timezone = this.getTimeZone()
    const datestring = `${this.occurred_date_ngb['year']}-${(this.occurred_date_ngb['month']).toString().padStart(2, '0')}-\
${this.occurred_date_ngb['day'].toString().padStart(2, '0')}\
T${this.occurred_time.hour.toString().padStart(2, '0')}:${this.occurred_time.minute.toString().padStart(2, '0')}:00\
${this.getOffset(this.getTimeZone())}:00`
    let d = new Date(datestring)
    this.record['occurred_from'] = d
    this.record['occurred_to'] = d
    this.record['timezone'] = this.timezone
  }
  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        term.length < 2 ? [] : this.autocomplete_terms.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10)
      )
    );
  geocode: OperatorFunction<string, readonly { text, lat, lon }[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.geocoding = true),
      switchMap(term =>
        this.recordService.getForward(this.roadmap_uuid, {
          'term': term,
          'bbox': `${this.map.getBounds().getSouth()},${this.map.getBounds().getEast()},${this.map.getBounds().getNorth()},${this.map.getBounds().getWest()}`,
          'limit': 5
        }).pipe(
          tap(() => this.geocodeFailed = false),
          catchError(() => {
            this.geocodeFailed = true;
            return of([]);
          }))
      ),
      tap(() => this.geocoding = false)
    )
  geoResultFormatter = (x: any) => {
    if (x['address'])
      return x['address']['fullname']
    return " "
  }
  geoInputFormatter = (x: any) => {
    if (typeof x == 'object') {
      if (x['address'])
        return x['address']['fullname']
      return " "
    }
    return x
  }
  setFieldValue(e) {
    let xterm;
    const type = this.schema['definitions'][e.table].properties[e.field]
    const f = e.event.srcElement.id
    switch (type.fieldType) {
      case "integer":
        xterm = parseInt(e.event.srcElement.value)
        break
      default:
        xterm = e.event.srcElement.value
    }
    if (this.reverse_trans && xterm in this.reverse_trans) xterm = this.reverse_trans[xterm]

    if (e.index >= 0) {
      this.record['data'][e.table][e.index][e.field] = xterm
    } else {
      this.record['data'][e.table][e.field] = xterm
    }
    this.record['data'] = JSON.parse(JSON.stringify(this.record['data']))
    if (f && document.getElementById(f)) {
      setTimeout(() => {
        document.getElementById(f).focus()
      }, 100)
    }
  }
  loadFieldFile(eve) {
    this.loadFile(eve.event, eve.table, eve.field, eve.index)
  }
  loadFile(e: any, table: any, field: string, index = null) {
    if (e.srcElement['files'] && e.srcElement['files'].length) {
      let file = e.srcElement['files'][0]
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        if (index !== null && index > -1)
          table[index][field] = reader.result
        else
          table[field] = reader.result
      }
    }
  }
  setCheckField(e: any) {
    let elem = e.event.srcElement
    const fieldId = e.id
    if (("index" in e) && (e.index > -1)) {
      if (!this.record['data'][e.table])
        this.record['data'][e.table] = []
      while (this.record['data'][e.table].length < e.index + 1)
        this.record['data'][e.table].push({ "_localId": uuid.v4() })
      if (!this.record['data'][e.table][e.index][e.field]) {
        this.record['data'][e.table][e.index][e.field] = []
      }
      if (elem.checked) {
        if (this.record['data'][e.table][e.index][e.field].indexOf(elem.value) < 0)
          this.record['data'][e.table][e.index][e.field].push(elem.value)
      } else {
        let i = this.record['data'][e.table][e.index][e.field].indexOf(elem.value)
        if (i > -1) {
          this.record['data'][e.table][e.index][e.field].splice(i, 1)
        }
      }
    } else {
      if (!this.record['data'][e.table])
        this.record['data'][e.table] = { "_localId": uuid.v4() }
      if (!this.record['data'][e.table][e.field]) {
        this.record['data'][e.table][e.field] = []
      }
      if (elem.checked) {
        if (this.record['data'][e.table][e.field].indexOf(elem.value) < 0)
          this.record['data'][e.table][e.field].push(elem.value)
      } else {
        let i = this.record['data'][e.table][e.field].indexOf(elem.value)
        if (i > -1) {
          this.record['data'][e.table][e.field].splice(i, 1)
        }
      }
    }
    this.record['data'] = JSON.parse(JSON.stringify(this.record['data']))
    if (fieldId && document.getElementById(fieldId)) {
      setTimeout(() => {
        document.getElementById(fieldId).focus()
      }, 100)
    }
  }
  onMultipleCheckChange(e: any, t: string, idx: number, f: any) {
    if (!this.record['data'][t][idx][f])
      this.record['data'][t][idx][f] = []

    let k = e.srcElement.value
    if (e.srcElement.checked) {
      this.record['data'][t][idx][f].push(k)
    } else {
      this.record['data'][t][idx][f].splice(f.indexOf(k), 1)
    }
  }
  onSingleCheckChange(e: any, t: string, f: string) {
    if (!this.record['data'][t][f])
      this.record['data'][t][f] = []
    let k = e.srcElement.value
    if (e.srcElement.checked) {
      this.record['data'][t][f].push(k)
    } else {
      this.record['data'][t][f].splice(f.indexOf(k), 1)
    }
  }
  selectGeocodedOption(e: any): any {
    if (!e.item) return
    if (e.item['address']) {
      this.record['location_text'] = e.item['address']['road']
    }
    this.record['geom']['coordinates'] = [e.item.lon, e.item.lat]
    let latlng = new L.latLng(e.item.lat, e.item.lon)
    if (latlng) {
      this.marker.remove()
      this.setMarker(latlng)
      this.marker.addTo(this.map)
      this.map.panTo(latlng)
      if (this.map.getZoom() < 17) this.map.setZoom(17)
    }
  }
  isNotLastNavItem() {
    return this.nav && (this.lastNavItem != this.nav.activeId)
  }
  isNotFirstNavItem() {
    return this.nav && (this.firstNavItem != this.nav.activeId)
  }
  setAccordionOpen(idx: any) {
    this.accordionOpenedItem = idx
  }
  nextNavItem() {
    const defs = Object.keys(this.schema['definitions']).sort((a, b) => this.schema['definitions'][a].propertyOrder - this.schema['definitions'][b].propertyOrder)
    let i = 0
    while (i < defs.length && defs[i] != this.nav.activeId) {
      i++;
    }
    this.nav.select(defs[i + 1])
    this.isFirstNavItem = false
    this.isLastNavItem = i + 2 >= defs.length
  }
  previousNavItem() {
    const defs = Object.keys(this.schema['definitions']).sort((a, b) => this.schema['definitions'][a].propertyOrder - this.schema['definitions'][b].propertyOrder)
    let i = defs.length - 1
    while (i > 0 && defs[i] != this.nav.activeId) {
      i--;
    }
    this.nav.select(defs[i - 1])
    this.isFirstNavItem = i == 1
    this.isLastNavItem = false
  }
  setAutocompleteTerms(e: any) {
    let terms = e.words
    let extra = e.extra
    if (extra) {
      this.recordService.getNames(extra, localStorage.getItem("Language")).pipe(first()).subscribe((d) => {
        this.autocomplete_terms = d["result"]
      })
    } else {
      this.autocomplete_terms = []
      this.reverse_trans = {}
      terms.forEach((t) => {
        let translated = this.translateService.instant(t)
        this.reverse_trans[translated] = t
        this.autocomplete_terms.push(translated)
      })
    }
  }
  startScribble(e) {
    this.isDrawing = true
  }
  startDrawingCanvas(e, canvas) {
    this.startDraw(canvas, e, true)
  }

  startDraw(modal: TemplateRef<any>, definition: any, editing: boolean) {
    if (!editing) return
    $(".modal-header").hide()
    $(".modal-body").hide()
    $(".modal-footer").hide()
    this.imageEditing = definition
    let bg = null
    this.modalService.open(modal, {
      size: 'lg', backdrop: 'static', keyboard: false
    });
    var container = document.querySelector<HTMLElement>(".canvas-container")
    container.style.height = `${window.innerHeight - 200}px`;
    var canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    if (!canvas) return;

    //make a 2D context
    let commentCanvasContext = canvas.getContext("2d");
    //set the line parameters
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight
    this.hasRoadMap = false
    this.canvas_extra = null
    if (("extra" in definition) && definition["extra"] && definition["extra"].length) {
      this.canvas_extra = definition["extra"]
    }
    if ("value" in definition) {
      var image = new Image();
      image.onload = function () {
        commentCanvasContext.drawImage(image, 0, 0);
      };
      image.src = definition.value
    } else {
      if ("format" in definition) {
        if (definition.format == "map") {
          this.hasRoadMap = true
          this.loadMap()
        }
      }
      if (this.canvas_extra)
        this.loadImageFromUrl(this.canvas_extra)
    }
    commentCanvasContext.lineWidth = 3;
    commentCanvasContext.lineJoin = 'round';
    commentCanvasContext.lineCap = 'round';
    commentCanvasContext.strokeStyle = 'black';
    commentCanvasContext.translate(0.5, 0.5);

    canvas.addEventListener("mousemove", function (e: any) {
      //store the old current mouse position and the previous mouse position
      var modalDialog = $(".modal-dialog")[0];
      mousePositions.push({
        "x": e.pageX - (container.offsetLeft + modalDialog.offsetLeft), "y":
          e.pageY - (container.offsetTop + modalDialog.offsetTop)
      })
    });
    canvas.addEventListener("touchmove", function (e: any) {
      let modalDialog = $(".modal-dialog")[0];
      e.stopPropagation()
      mousePositions.push({
        "x": e.touches[0].pageX - (container.offsetLeft + modalDialog.offsetLeft), "y":
          e.touches[0].pageY - (container.offsetTop + modalDialog.offsetTop)
      })
    });
    var onPaint = this.onPaint
    //mouse down 
    canvas.addEventListener('mousedown', function (e) {
      var modalDialog = $(".modal-dialog")[0];
      mousePositions = [
        {
          "x": e.pageX - (container.offsetLeft + modalDialog.offsetLeft), "y":
            e.pageY - (container.offsetTop + modalDialog.offsetTop)
        }
      ]
      canvas.addEventListener('mousemove', onPaint);
    });
    canvas.addEventListener('touchstart', function (e) {
      e.stopPropagation()
      //add an additional listener to draw
      var modalDialog = $(".modal-dialog")[0];
      mousePositions = [{
        "x": e.touches[0].pageX - (container.offsetLeft + modalDialog.offsetLeft), "y":
          e.touches[0].pageY - (container.offsetTop + modalDialog.offsetTop)
      }]
      canvas.addEventListener('touchmove', onPaint);
    });

    //mouse up
    canvas.addEventListener('mouseup', function () {
      //remove the additional mouse move listener
      mousePositions = []
      canvas.removeEventListener('mousemove', onPaint);
    });
    canvas.addEventListener('touchend', function (e) {
      e.stopPropagation()
      canvas.removeEventListener('touchmove', onPaint);
    });
  }

  loadImageFromUrl(url) {
    var image = new Image();
    var canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    image.onload = function () {
      var hRatio = canvas.width / image.width;
      var vRatio = canvas.height / image.height;
      var ratio = Math.min(hRatio, vRatio);
      canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width * ratio, image.height * ratio);
    };
    image.src = url
  }

  loadMap() {
    var canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    let commentCanvasContext = canvas.getContext("2d");
    let yx = this.record["geom"].coordinates


    let bg = new Image();
    //bg.setAttribute('crossorigin', 'anonymous');
    bg.onload = function () {
      let sx = 0.5 * (1000 - canvas.width)
      let dx = 0
      if (sx < 0) {
        dx = -1 * sx
        sx = 0
      }
      let dy = 0
      let sy = 0.5 * (1000 - canvas.height)
      if (sy < 0) {
        dy = -1 * sy
        sy = 0
      }
      commentCanvasContext.drawImage(bg, sx, sy, canvas.width, canvas.height, dx, dy, canvas.width, canvas.height);
      bg.setAttribute('crossorigin', 'anonymous');
    };
    bg.src = `${this.recordService.getBackend()}/api/roadmaps/${this.roadmap_uuid}/map/?latlong=${yx[1]},${yx[0]}`
  }


  endDrawing(event) {
    event.close()
    $(".modal-header").show()
    $(".modal-body").show()
    $(".modal-footer").show()
    var canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    var dataURL = canvas.toDataURL("image/png");
    let d = JSON.parse(JSON.stringify(this.record['data']))

    if (this.imageEditing) {
      if ("index" in this.imageEditing && this.imageEditing["index"] > -1) {
        d[this.imageEditing.table][this.imageEditing.index][this.imageEditing.field] = dataURL
      } else {
        d[this.imageEditing.table][this.imageEditing.field] = dataURL
      }
    }
    this.record['data'] = d
    this.isDrawing = false
  }
  cancelDrawing(modal: any) {
    this.isDrawing = false
    modal.close(0)
    $(".modal-header").show()
    $(".modal-body").show()
    $(".modal-footer").show()
  }
  resetDrawing() {
    let canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.hasRoadMap)
      this.loadMap()
    if (this.canvas_extra) {
      this.loadImageFromUrl(this.canvas_extra)
    }
  }
  onPaint(event: any) {
    event.stopPropagation()
    var canvas = document.querySelector<HTMLCanvasElement>("#scribble");
    let commentCanvasContext = canvas.getContext("2d");
    //draw the line
    commentCanvasContext.beginPath();
    let last = null
    while (mousePositions.length > 1) {
      let pos = mousePositions.shift()
      commentCanvasContext.moveTo(pos["x"], pos["y"])
      last = { "x": (mousePositions[0]["x"] + pos["x"]) / 2, "y": (mousePositions[0]["y"] + pos["y"]) / 2 }
      commentCanvasContext.quadraticCurveTo(pos["x"], pos["y"], last["x"], last["y"])
    }
    if (mousePositions.length) commentCanvasContext.lineTo(mousePositions[0]["x"], mousePositions[0]["y"])
    commentCanvasContext.closePath();
    commentCanvasContext.stroke();
  }
  submit(eve: any, modal) {
    if (eve.charCode == 13) this.saveRecord(modal)
  }
  scrollTop(event) {
    console.log("scroll to the top")
  }
  viewReset(eve) {
    const b = eve.target.getBounds()
    const z = eve.target.getZoom()
    const currentBounds = Object.values(b.getSouthWest()).concat(Object.values(b.getNorthEast()))
    if (this.previousBounds === JSON.stringify(currentBounds) || z < 14) {
      return
    }
    this.previousBounds = JSON.stringify(currentBounds)
    const params = {
      "lang": localStorage.getItem("Language"),
      "bounds": currentBounds
    }
    if (!!window['android']) {
      const lines = window['android'].getLocalRoads(JSON.stringify(params))
      const gsjs = L.geoJson(JSON.parse(lines), { style: { weight: "8", "opacity": 0.5, color: "#ff3400" } })
      window['showLocalRoads'](gsjs)
    }
  }
  getTimeZone() {
    return this.timezone || this.config['TIMEZONE']
  }
  setTimeZone(event) {
    this.timezone = event.srcElement.value
  }
  getTimeZones = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200), // Wait 200ms after the last keystroke before considering the term
      distinctUntilChanged(), // Only emit when the current value is different from the last
      map(term => term === '' ? this.TIMEZONES : this.TIMEZONES.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );

  formatter = (result: string) => result // Example formatter
  getOffset = (timeZone) => {
    const timeZoneName = Intl.DateTimeFormat("ia", {
      timeZoneName: "short",
      timeZone,
    })
      .formatToParts()
      .find((i) => i.type === "timeZoneName").value;
    const offset = timeZoneName.slice(3).replace(/([+-])(\d)$/, "$10$2");
    if (!offset) return '+00';
    return offset;
  };
  getItemCount(table, fld, field) {
    let count = "0"
    if (field.counted) {
      if (this.record['data'] && this.record['data'][field.counted]) {
        if (field.countedFilter && field.countedFilterRegex) {
          count = this.record['data'][field.counted].filter((k) => {
            if (k[field.countedFilter] && k[field.countedFilter].match(new RegExp(field.countedFilterRegex)))
              return true
          }).length.toString()
        } else {
          count = this.record['data'][field.counted].length.toString()
        }
      }
    }
    this.record['data'][table][fld] = count
    return count
  }

}
var mousePositions: Array<object> = []
