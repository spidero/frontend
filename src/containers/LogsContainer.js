import React from 'react'
import api from '../api'
import Logs from '../components/Logs'
import useAuth0 from '../utils/useAuth0'
import history from '../history'


const LogsContainer = ({ setCachedLogDetails }) => {
  const { user, isModerator } = useAuth0()
  const [logs, setLogs] = React.useState()
  const [loadingLogs, setLoadingLogs] = React.useState(true)
  const [errorLogs, setErrorLogs] = React.useState(false)
  const [page, setPage] = React.useState(0) // Page numeration starts at 0.
  const [logsTotal, setlogsTotal] = React.useState()
  const rowsPerPage = 10

  const getLogs = async page => {
    try {
      setLoadingLogs(true)
      const { data: { logs, total } } = await api.post('get_logs', {
        size: rowsPerPage,
        offset: rowsPerPage * page,
      })
      setLogs(logs)
      setlogsTotal(total)
    } catch (err) {
      console.error(err)
      setErrorLogs(true)
    }
    setLoadingLogs(false)
  }
  React.useEffect(() => { isModerator && getLogs(page) }, [page, isModerator])

  return (
    isModerator
      ? <Logs
        logs={logs}
        loadingLogs={loadingLogs}
        errorLogs={errorLogs}
        page={page}
        setPage={setPage}
        rowsInTotal={logsTotal}
        rowsPerPage={rowsPerPage}
        user={user}
        setDetails={data => {
          setCachedLogDetails(data)
          history.push(`/moderator/log/${data.id}`)
        }}
      />
      : null
  )
}

export default LogsContainer
