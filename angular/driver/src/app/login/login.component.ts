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
    loading = false;
    submitted = false;
    returnUrl: string;
    err: string;
    @Output() entering = new EventEmitter<any>()

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthService,
        private recordService: RecordService
    ) {
        // redirect to home if already logged in                                                                                                                                                                                                                                                                                                                                                                    
        //if (this.authenticationService.currentUserValue) {
        //    this.router.navigate(['/map']);
        //}
    }

    setCookie (name,value,days=100) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }
    getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    ngOnInit() {    
        localStorage.removeItem('token');
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
localStorage.setItem("position", `${position.coords.latitude}\t${position.coords.longitude}`)
            })
        }
        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        //this.alertService.clear();

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.err=null;
        this.authenticationService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe(
                data => {
                    if(data.hasOwnProperty('token')){
                        console.log(data)
                        console.log("LOGIN SUCCEEDED")
                        this.setCookie('AuthService.canWrite', 1);
                        this.setCookie('AuthService.token', data['token'])
                        this.setCookie('AuthService.userId', data['user'])
                        this.setCookie('AuthService.isAdmin', data['is_admin'])

                        localStorage.setItem('token', data['token']);
                        localStorage.setItem('config', JSON.stringify(data['config']));
                        this.recordService.getRecordType().subscribe(
                            rata=>{
                                if(rata['results']){
                                    let schema_uuid;
                                    for (let i = 0; i < rata['results'].length; i++) {
                                        if(rata['results'][i]['label']==data['config'].PRIMARY_LABEL){
                                            schema_uuid=rata['results'][i]['current_schema'];
                                        };
                                    }
                                    if(schema_uuid){
                                        this.recordService.getRecordSchema(schema_uuid).subscribe(
                                            sata=>{
                                                localStorage.setItem('record_schema', JSON.stringify(sata));
                                                this.entering.emit(null)
                                                this.router.navigateByUrl('/')
                                            }
                                        )
                                    }else{
                                        this.err="record schema not found for "+data['config'].PRIMARY_LABEL;
                                    }
                                }else{
                                    this.err=data['config'].PRIMARY_LABEL+" record type not found";
                                }
                        })
                    }
                    
                },
                error => {
                    if(error.status==400){
                        this.err="Cannot login with the credentials";
                    }
                    if(error.status==0){
                        this.err="The server is unreachable.";
                    }
                    
                    this.loading = false;
                });
    }
}