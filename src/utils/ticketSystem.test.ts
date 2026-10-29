import { beforeEach, expect, it, vi } from 'vitest';
import { consumeTicket, getTickets, setTickets } from './ticketSystem';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

it('consumes one owned ticket for each new run and refuses when empty', () => {
  setTickets(2);
  expect(consumeTicket()).toBe(true);
  expect(getTickets()).toBe(1);
  expect(consumeTicket()).toBe(true);
  expect(getTickets()).toBe(0);
  expect(consumeTicket()).toBe(false);
  expect(getTickets()).toBe(0);
});