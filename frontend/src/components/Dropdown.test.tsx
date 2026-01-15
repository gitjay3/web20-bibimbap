import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown from './Dropdown';

// SVG 모킹
vi.mock('@/assets/icons/chevron-down.svg?react', () => ({
  default: () => <span data-testid="down-icon">▼</span>,
}));

const mockOptions = [
  { key: 'option1', label: 'Option 1' },
  { key: 'option2', label: 'Option 2' },
  { key: 'option3', label: 'Option 3' },
] as const;

type OptionKey = (typeof mockOptions)[number]['key'];

describe('Dropdown', () => {
  it('선택된 값의 라벨을 렌더링한다', () => {
    const setValue = vi.fn();

    render(<Dropdown<OptionKey> options={mockOptions} value="option1" setValue={setValue} />);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('버튼 클릭 시 드롭다운이 열린다', async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();

    render(<Dropdown<OptionKey> options={mockOptions} value="option1" setValue={setValue} />);

    // 초기에는 옵션 목록이 보이지 않음
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();

    // 버튼 클릭하여 열기
    const button = screen.getByRole('button');
    await user.click(button);

    // 옵션들이 표시됨
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('옵션 선택 시 setValue가 호출된다', async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();

    render(<Dropdown<OptionKey> options={mockOptions} value="option1" setValue={setValue} />);

    // 드롭다운 열기
    await user.click(screen.getByRole('button'));

    // Option 2 선택
    await user.click(screen.getByText('Option 2'));

    expect(setValue).toHaveBeenCalledWith('option2');
  });

  it('옵션 선택 후 드롭다운이 닫힌다', async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();

    render(<Dropdown<OptionKey> options={mockOptions} value="option1" setValue={setValue} />);

    // 드롭다운 열기
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    // 옵션 선택
    await user.click(screen.getByText('Option 2'));

    // 드롭다운이 닫힘 (Option 2가 목록에서 사라짐)
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
  });

  it('드롭다운이 열려있을 때 옵션을 선택하면 닫힌다', async () => {
    const user = userEvent.setup();
    const setValue = vi.fn();

    render(<Dropdown<OptionKey> options={mockOptions} value="option1" setValue={setValue} />);

    // 열기
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();

    // Option 3 선택으로 닫기
    await user.click(screen.getByText('Option 3'));
    expect(setValue).toHaveBeenCalledWith('option3');
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('일치하는 옵션이 없으면 key를 라벨로 표시한다', () => {
    const setValue = vi.fn();

    render(
      <Dropdown<string>
        options={[{ key: 'known', label: 'Known' }]}
        value="unknown"
        setValue={setValue}
      />,
    );

    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
