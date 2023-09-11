# txtars

The team at [Canopy](https://canopyclimate.com) has a diverse history of programming language experience; we wanted a way to casually teach each other a little of each of those languages. The approach we landed on was to choose a super-simple library—Go’s [txtar](https://pkg.go.dev/golang.org/x/tools/txtar)—and translate it into other languages as a team. We then fuzz-test each result.

Our goals for each translation are to be as idiomatic as possible while remaining functionally equivalent to the Go implementation and to exercise enough of the language such that team members get a feel for it. We make no promises as to the absolute idiomatic perfection of each translation, and welcome PRs of alternative implementations that show off unexplored language features.

Currently, we have translations in:

- [TypeScript](./txtar-js)
- [Elixir](./txtar-ex)

We also have [an “oracle” webserver](./txtar-go/) that calls the official Go implementation for checking and fuzzing purposes.

Right now, fuzzing happens in the TypeScript implementation, as Elixir does not have a proper fuzzer. Future translations will prefer fuzzers in the same language if possible.
