import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { RecordService } from '../record.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    captchaForm: FormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;
    errorMessage: string;
    @Output() entering = new EventEmitter<any>()
    backend: string = ""
    primeiro_acesso: boolean;
    captcha_id: string;
    captcha_image: string;
    messages={"LOGIN.CAPTCHA_ERROR":"Erro de captcha"}
    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthService,
        private recordService: RecordService,
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
        let c = this.getCookie('AuthService.token')
        if (c) {
            this.setCookie('AuthService.token', '', -1)
            this.authenticationService.logout()
        }
        localStorage.clear()
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
    }
    loginWithGoogle(): void {
        window.location.href = `${this.authenticationService.getBackend()}/oidc/authenticate/`
    }

    get f() { return this.loginForm.controls; }

    onSubmit() {
        if (this.loginForm.invalid) {
            return;
        }
        this.submitted = true;
        this.loading = true;
        this.errorMessage = null;
        if (this.f.password) {
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
        if (this.f.captcha_1) {
            this.authenticationService.createUser({
                'email': this.f.username.value,
                'captcha_0': this.f.captcha_0.value,
                'captcha_1': this.f.captcha_1.value,
            }).pipe(first()).subscribe({
                next: data => {
                    console.log(data)
                },
                error: err => {
                    console.log(err)

                    if(err['error'] && err["error"]['captcha_1']){
                        this.errorMessage=(this.messages[err["error"]['captcha_1']])?this.messages[err["error"]['captcha_1']]:err["error"]['captcha_1']
                    }
                    this.loading=false
                    this.reloadCaptcha()
                }

            })
        }
    }
    primeiroAcesso() {
        this.authenticationService.getSignupForm().subscribe(data => {
            this.captcha_id = data.match(/<input [^>]+>/g).filter(k => { return k.match(/name="captcha_0"/) }).pop().match(/value="([^"]+)"/).pop()
            this.captcha_image = `${this.recordService.getBackend()}/captcha/image/${this.captcha_id}/`
            this.errorMessage = ''
            this.primeiro_acesso = true
            this.loginForm = this.formBuilder.group({
                username: ['', Validators.required],
                captcha_1: ['', Validators.required],
                captcha_0: ['', Validators.required],
            });
        })
    }
    reloadCaptcha(){
        this.authenticationService.getSignupForm().subscribe(data => {
            this.captcha_id = data.match(/<input [^>]+>/g).filter(k => { return k.match(/name="captcha_0"/) }).pop().match(/value="([^"]+)"/).pop()
            this.captcha_image = `${this.recordService.getBackend()}/captcha/image/${this.captcha_id}/`
        })
    }
}