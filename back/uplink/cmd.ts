type Repo = {
  remote: string
  name: string
}

export function send(msg: ['repos-list', Repo[]]) {}

export function receive(msg: []) {}
