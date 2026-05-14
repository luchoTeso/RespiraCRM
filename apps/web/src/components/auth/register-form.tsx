'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, LockKeyhole, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CaptchaField } from './captcha-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api-client';

const DEV_MODE = !process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

const schema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.email('Ingresa un correo válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    captchaToken: z.string().min(1, 'Completa la validación CAPTCHA'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      captchaToken: DEV_MODE ? 'dev-token' : '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          captchaToken: DEV_MODE ? 'dev-token' : values.captchaToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(err?.message)
            ? err.message.join(', ')
            : err?.message || 'No fue posible crear la cuenta',
        );
      }

      toast.success('Cuenta creada correctamente. ¡Bienvenido!');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No fue posible crear la cuenta',
      );
    }
  });

  return (
    <div className="grid min-h-screen lg:h-screen lg:overflow-hidden grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
      {/* Panel izquierdo — mismo diseño que login */}
      <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#0f6c8d_0%,#084c61_100%)] px-10 py-12 text-white lg:flex lg:flex-col">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          <Activity className="h-4 w-4" />
          RespiraCRM
        </div>
        <div className="mt-14 max-w-xl">
          <h1 className="text-5xl font-semibold leading-tight">
            Gestión comercial y operativa para soluciones respiratorias.
          </h1>
          <p className="mt-6 text-lg text-white/75">
            Centraliza pipeline, propuestas, órdenes de servicio, facturas y
            supervisión interna con una experiencia tipo SaaS corporativa.
          </p>
        </div>
        <div className="mt-auto grid gap-4 md:grid-cols-3">
          {[
            [
              'Empresas y contactos',
              'Gestión B2B con trazabilidad por unidad de negocio.',
            ],
            [
              'Ventas y propuestas',
              'Control de etapas, montos, aprobación y cierre.',
            ],
            [
              'Operación clínica',
              'Órdenes de servicio, revisiones y seguimiento.',
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm"
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-2 text-sm text-white/70">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Panel derecho — formulario de registro */}
      <section className="overflow-y-auto px-4 py-8 md:px-8">
        <div className="flex min-h-full items-center justify-center">
          <Card className="w-full max-w-xl p-8 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Crear cuenta
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Únete a RespiraCRM
            </h2>
            <p className="mt-2 text-sm text-muted">
              Completá los datos para crear tu cuenta. Tu rol inicial será
              Vendedor.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <Field
              label="Nombre completo"
              error={form.formState.errors.name?.message}
            >
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  placeholder="Juan Pérez"
                  {...form.register('name')}
                />
              </div>
            </Field>

            <Field
              label="Correo electrónico"
              error={form.formState.errors.email?.message}
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  placeholder="juan@empresa.com"
                  {...form.register('email')}
                />
              </div>
            </Field>

            <Field
              label="Contraseña"
              error={form.formState.errors.password?.message}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  {...form.register('password')}
                />
              </div>
            </Field>

            <Field
              label="Confirmar contraseña"
              error={form.formState.errors.confirmPassword?.message}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  type="password"
                  placeholder="Repetí tu contraseña"
                  {...form.register('confirmPassword')}
                />
              </div>
            </Field>

            {!DEV_MODE && (
              <CaptchaField
                value={form.watch('captchaToken')}
                error={form.formState.errors.captchaToken?.message}
                onChange={(token) =>
                  form.setValue('captchaToken', token, { shouldValidate: true })
                }
              />
            )}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-muted">O registrate con</span>
            </div>
          </div>

          <Link
            href="/backend/api/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </a>

          <p className="mt-6 text-center text-sm text-muted">
            ¿Ya tenés cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Iniciá sesión
            </Link>
          </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
