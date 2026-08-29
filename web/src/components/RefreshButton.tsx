import { FiRefreshCw } from 'react-icons/fi'

export const RefreshButton = ({
  onRefresh,
  refreshTime = 10,
  setRefreshTime = () => {},
  timeOptions = [0, 1, 5, 10, 15, 30, 60, 120],
}: {
  onRefresh: () => void
  refreshTime?: number
  setRefreshTime?: (time: number) => void
  timeOptions?: number[]
}) => {
  return (
    <div className="flex flex-row items-center border border-gray-300 text-gray-700 rounded-full h-[50px] overflow-hidden">
      <button
        className="flex items-center justify-center px-4 hover:bg-gray-100 text-md whitespace-nowrap h-full"
        onClick={onRefresh}
        title="Refresh"
      >
        <FiRefreshCw className="inline-block text-2xl" />
      </button>
      |
      <select
        value={refreshTime}
        onChange={e => setRefreshTime(Number(e.target.value))}
        className="bg-transparent outline-none text-lg pr-4 pl-2 h-full cursor-pointer text-center"
        title="Selecione o intervalo de atualização"
      >
        {timeOptions.map(time => (
          <option key={time} value={time}>
            {time === 0 ? '—' : `${time}s`}
          </option>
        ))}
      </select>
    </div>
  )
}
