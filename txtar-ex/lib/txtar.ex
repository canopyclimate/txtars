defmodule Txtar.Archive do
  defstruct comment: nil, files: []
end

defmodule Txtar.File do
  defstruct name: nil, data: nil
end

defmodule Txtar do
  @moduledoc """
  Implements a trivial text-based file archive format.

  The goals for the format are:

   - be trivial enough to create and edit by hand.
   - be able to store trees of text files describing go command test cases.
   - diff nicely in git history and code reviews.

  Non-goals include being a completely general archive format,
  storing binary data, storing file modes, storing special files like
  symbolic links, and so on.

  # Txtar format

  A txtar archive is zero or more comment lines and then a sequence of file entries.
  Each file entry begins with a file marker line of the form "-- FILENAME --"
  and is followed by zero or more file content lines making up the file data.
  The comment or file content ends at the next file marker line.
  The file marker line must begin with the three-byte sequence "-- "
  and end with the three-byte sequence " --", but the enclosed
  file name can be surrounding by additional white space,
  all of which is stripped.

  If the txtar file is missing a trailing newline on the final line,
  parsers should consider a final newline to be present anyway.

  There are no possible syntax errors in a txtar archive.
  """

  alias Txtar.Archive
  alias Txtar.File, as: TFile

  @doc """
  Formats an archive into a binary.
  """
  def format(%Archive{comment: comment, files: files}) do
    for f <- files, reduce: fix_nl(comment) do
      acc ->
        acc <> "-- #{f.name} --\n#{fix_nl(f.data)}"
    end
  end

  @doc """
  Parses the contents of a text file into an Archive.
  """
  def parse_file(path) do
    case File.read(path) do
      {:ok, data} ->
        parse(data)

      err ->
        err
    end
  end

  @doc """
  Parses text into an Archive.
  """
  def parse(data) when is_binary(data) do
    data
    |> String.split("\n")
    |> Enum.reduce([%TFile{name: nil, data: ""}], &parse_reduce/2)
    # We tack an extra newline on when reducing, so trim it here from the final file.
    |> then(fn [%TFile{name: name, data: data} | rest] ->
      [%TFile{name: name, data: String.replace_suffix(data, "\n", "")} | rest]
    end)
    |> Enum.reverse()
    |> archive_for()
  end

  defp archive_for([%TFile{name: nil, data: comment} | rest]),
    do: %Archive{comment: comment, files: rest}

  defp archive_for(files), do: %Archive{comment: "", files: files}

  defp parse_reduce(line, [%TFile{name: name, data: data} | rest] = files) do
    case match_file_marker(line) do
      {:marker, new_name} ->
        [%TFile{name: new_name, data: ""} | files]

      {:data, line} ->
        [%TFile{name: name, data: data <> line <> "\n"} | rest]
    end
  end

  defp match_file_marker(line) do
    case Regex.named_captures(~r/^-- \s*(?<name>\S.*?)\s* --$/, line) do
      %{"name" => name} -> {:marker, name}
      _ -> {:data, line}
    end
  end

  defp fix_nl(""), do: ""

  defp fix_nl(data) when is_binary(data) do
    if String.ends_with?(data, "\n"), do: data, else: data <> "\n"
  end
end
