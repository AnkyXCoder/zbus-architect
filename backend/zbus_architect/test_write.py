def split_arguments(arg_text: str) -> list[str]:
    args: list[str] = []
    depth = 0
    current: list[str] = []
    in_string = False
    string_char: str | None = None

    for ch in arg_text:
        if in_string:
            current.append(ch)
            if ch == string_char:
                in_string = False
            continue

        if ch == '"' or ch == "'":
            in_string = True
            string_char = ch
            current.append(ch)
            continue

        if ch in "([{":
            depth += 1
            current.append(ch)
        elif ch in "]})"):
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            arg = "".join(current).strip()
            if arg:
                args.append(arg)
            current = []
        else:
            current.append(ch)

    if current:
        arg = "".join(current).strip()
        if arg:
            args.append(arg)
    return args
