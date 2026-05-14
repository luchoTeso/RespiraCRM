'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, LockKeyhole, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
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

const schema = z.object({
  email: z.email('Ingresa un correo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  captchaToken: z.string().min(1, 'Completa la validación CAPTCHA'),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      captchaToken: DEV_MODE ? 'dev-token' : '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          captchaToken: DEV_MODE ? 'dev-token' : values.captchaToken,
        }),
      });

      toast.success('Sesión iniciada correctamente');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión',
      );
    }
  });

  return (
    <div className="grid min-h-screen lg:h-screen lg:overflow-hidden grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
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

      <section className="overflow-y-auto px-4 py-8 md:px-8">
        <div className="flex min-h-full items-center justify-center">
          <Card className="w-full max-w-xl p-8 md:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Inicio de sesión
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Bienvenido a RespiraCRM
            </h2>
            <p className="mt-2 text-sm text-muted">
              Usa tus credenciales administrativas o comerciales para ingresar.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <Field
              label="Correo electrónico"
              error={form.formState.errors.email?.message}
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  placeholder="admin@respiracrm.local"
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
                  placeholder="Ingresa tu contraseña"
                  {...form.register('password')}
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
              {form.formState.isSubmitting
                ? 'Validando acceso...'
                : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-muted">O continuá con</span>
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
            ¿No tenés cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Registrate
            </Link>
          </p>

          </Card>
        </div>
      </section>
    </div>
  );
}
