import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatosUsuario, Rol, Usuario } from '../../models/usuario';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UsuariosService } from '../../services/usuarios.service';
import { mensajeError } from '../../utils/errores';

type Campo = 'nombre' | 'correo' | 'password';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly campoNombre = viewChild<ElementRef<HTMLInputElement>>('campoNombre');

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly busqueda = signal('');
  protected readonly rolFiltro = signal<Rol | null>(null);

  /** Panel lateral: cerrado, creando (editando = null) o editando a alguien */
  protected readonly panelAbierto = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly guardando = signal(false);

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const rol = this.rolFiltro();
    return this.usuarios().filter(
      (u) =>
        (rol === null || u.rol === rol) &&
        (texto === '' ||
          u.nombre.toLowerCase().includes(texto) ||
          u.correo.toLowerCase().includes(texto)),
    );
  });

  /** Quien tiene la sesión no puede quitarse el acceso: la API también lo impide */
  protected readonly miId = computed(() => this.auth.usuario()?.id ?? null);

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(120)],
    }),
    rol: new FormControl<Rol>('USUARIO', { nonNullable: true }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(8), Validators.maxLength(72)],
    }),
    activo: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }

  protected alCambiarRol(valor: string): void {
    this.rolFiltro.set(valor === 'ADMIN' || valor === 'USUARIO' ? valor : null);
  }

  protected etiquetaRol(rol: Rol): string {
    return rol === 'ADMIN' ? 'Administrador' : 'Usuario';
  }

  protected abrirNuevo(): void {
    this.editando.set(null);
    this.formulario.reset({ nombre: '', correo: '', rol: 'USUARIO', password: '', activo: true });
    // Al crear, la contraseña es obligatoria
    this.formulario.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72),
    ]);
    this.abrirPanel();
  }

  protected abrirEdicion(usuario: Usuario): void {
    this.editando.set(usuario);
    this.formulario.reset({
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      password: '',
      activo: usuario.activo,
    });
    // Al editar, la contraseña es opcional: vacía significa "no cambiarla"
    this.formulario.controls.password.setValidators([
      Validators.minLength(8),
      Validators.maxLength(72),
    ]);
    this.abrirPanel();
  }

  protected cerrarPanel(): void {
    this.panelAbierto.set(false);
    this.editando.set(null);
  }

  protected mensaje(campo: Campo): string | null {
    const control = this.formulario.controls[campo];
    if (!(control.touched || control.dirty) || !control.errors) return null;

    switch (campo) {
      case 'nombre':
        return control.hasError('required')
          ? 'El nombre es obligatorio'
          : 'El nombre debe tener entre 2 y 100 caracteres';
      case 'correo':
        if (control.hasError('repetido')) return 'Ya existe un usuario con ese correo';
        if (control.hasError('required')) return 'El correo es obligatorio';
        return control.hasError('maxlength')
          ? 'El correo no puede pasar de 120 caracteres'
          : 'El correo no es válido';
      case 'password':
        if (control.hasError('required')) return 'La contraseña es obligatoria';
        return control.hasError('maxlength')
          ? 'La contraseña no puede pasar de 72 caracteres'
          : 'La contraseña debe tener al menos 8 caracteres';
    }
  }

  protected guardar(): void {
    this.formulario.controls.password.updateValueAndValidity();
    if (this.formulario.invalid || this.guardando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nombre, correo, rol, password, activo } = this.formulario.getRawValue();
    const base: Omit<DatosUsuario, 'password'> = {
      nombre: nombre.trim(),
      correo: correo.trim(),
      rol,
      activo,
    };

    const actual = this.editando();
    this.guardando.set(true);
    const peticion =
      actual === null
        ? this.usuariosService.crear({ ...base, password })
        : this.usuariosService.actualizar(actual.id, password === '' ? base : { ...base, password });

    peticion.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.usuarios.update((lista) =>
          actual === null
            ? [...lista, guardado]
            : lista.map((u) => (u.id === guardado.id ? guardado : u)),
        );
        this.toast.exito('Usuario guardado correctamente');
        this.cerrarPanel();
      },
      error: (error: unknown) => {
        this.guardando.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          // El correo repetido se muestra bajo su propio campo
          this.formulario.controls.correo.setErrors({ repetido: true });
          this.formulario.controls.correo.markAsTouched();
          return;
        }
        this.toast.error(mensajeError(error));
      },
    });
  }

  protected async eliminar(usuario: Usuario): Promise<void> {
    const eliminado = await this.usuariosService.eliminarConConfirmacion(usuario);
    if (!eliminado) return;
    this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
    if (this.editando()?.id === usuario.id) this.cerrarPanel();
  }

  private abrirPanel(): void {
    this.panelAbierto.set(true);
    // Espera a que el panel exista en pantalla para poner el cursor en el primer campo
    setTimeout(() => this.campoNombre()?.nativeElement.focus());
  }
}
