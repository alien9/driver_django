import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { RecordService } from '../record.service';
import { TranslateService } from '@ngx-translate/core';
import sha256 from 'crypto-js/sha256';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;
    errorMessage: string;
    @Output() entering = new EventEmitter<any>()
    backend: string = ""
    hasGoogle:boolean=false

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthService,
        private recordService: RecordService,
        private translate: TranslateService,
    ) {
    }
    setCookie(name, value, days = 100) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }
    getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    ngOnInit() {
        let c=this.getCookie('AuthService.token')
        if(c){ 
            this.setCookie('AuthService.token', '', -1)
            this.authenticationService.logout()
        }
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                localStorage.setItem("position", `${position.coords.latitude}\t${position.coords.longitude}`)
            })
        }
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.backend = this.recordService.getBackend()
        this.translate.get("GOOGLE_OAUTH_CLIENT_ID").subscribe((k)=>{
            this.hasGoogle=(k.length>0) && (k!='GOOGLE_OAUTH_CLIENT_ID')
        })        
    }  

    loginWithGoogle(): void {
        window.location.href=`${this.authenticationService.getBackend()}/oidc/authenticate/`
      }

    get f() { return this.loginForm.controls; }

    onSubmit() {
        if (this.loginForm.invalid) {
            return;
        }
        this.submitted = true;
        this.loading = true;
        this.errorMessage = null;
        this.authenticationService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe({
                next: data => {
                    if (data.hasOwnProperty('token')) {
                        this.setCookie('AuthService.canWrite', data["groups_name"].indexOf('admin') > 0 || data["groups_name"].indexOf('analyst') > 0);
                        this.setCookie('AuthService.token', data['token'])
                        this.setCookie('AuthService.userId', data['user'])
                        this.setCookie('AuthService.isAdmin', data["groups_name"].indexOf('admin') > 0)
                        localStorage.setItem('token', data['token']);
                        localStorage.setItem('config', JSON.stringify(data['config']));
                        this.entering.emit(null)
                        this.loading = false;
                        this.router.navigateByUrl('/')
                        localStorage.setItem("password", sha256(this.f.password.value))
                    }

                }, error: err => {
                    this.loading = false;
                    if (err.error && err.error['non_field_errors']) {
                        this.errorMessage = err.error['non_field_errors'][0]
                    } else {
                        this.errorMessage = err.message
                    }
                }, complete: () => console.log('HTTP request completed.')
            })
    }
}