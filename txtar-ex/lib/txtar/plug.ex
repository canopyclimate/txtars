defmodule Txtar.Plug do
  import Plug.Conn

  def init(options) do
    # initialize options
    options
  end

  def call(conn, _opts) do
    {conn, body} = read_full_body(conn)

    # Do round trip.
    resp =
      body
      |> Txtar.parse()
      |> Txtar.format()

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, resp)
  end

  defp read_full_body(conn, body \\ "") do
    case read_body(conn) do
      {:ok, b, conn} ->
        {conn, body <> b}

      {:more, b, conn} ->
        read_full_body(conn, body <> b)

      {:error, err} ->
        {:error, err}
    end
  end
end
