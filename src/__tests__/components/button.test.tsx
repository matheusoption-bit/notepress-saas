import { useEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

function PingStatus() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetch('http://localhost/api/ping', { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { status: string }) => setStatus(data.status))
      .catch(() => setStatus('error'));

    return () => {
      controller.abort();
    };
  }, []);

  return <span>{status}</span>;
}

describe('Button', () => {
  it('renderiza e dispara clique', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('usa MSW no ambiente de testes para chamadas fetch', async () => {
    render(<PingStatus />);
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });
});
