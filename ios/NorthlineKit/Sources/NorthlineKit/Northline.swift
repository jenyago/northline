import Foundation
import Observation

@MainActor
@Observable
public final class Northline {
    public static let shared = Northline()

    public private(set) var messages: [NorthlineMessage] = []
    public private(set) var call: NorthlineCall?
    public private(set) var user: NorthlineUser?
    public private(set) var conversationId: String?
    public private(set) var isSending = false
    public private(set) var lastError: String?

    public var appId: String?
    public var channel: NorthlineChannel = .ios

    private var transport: (any NorthlineTransport)?
    private var injected: (any NorthlineTransport)?
    private var handlers: [(NorthlineMessage) -> Void] = []

    public init(transport: (any NorthlineTransport)? = nil) {
        injected = transport
    }

    public func start(appId: String, baseURL: URL, channel: NorthlineChannel = .ios) {
        self.appId = appId
        self.channel = channel
        transport = injected ?? URLSessionTransport(baseURL: baseURL, appId: appId)
        messages = []
        call = nil
        user = nil
        conversationId = nil
        lastError = nil
    }

    public func identify(_ user: NorthlineUser) async throws {
        let payload = IdentifyPayload(appId: try requireAppId(), channel: channel, user: user)
        let response: IdentifyResult = try await post("/v1/customers/identify", payload)
        self.user = user
        conversationId = response.conversationId
        try await refresh()
    }

    public func send(_ body: String) async throws {
        let text = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        guard user != nil, conversationId != nil else { throw NorthlineError.notIdentified }
        isSending = true
        defer { isSending = false }
        let saved: NorthlineMessage = try await post(
            "/v1/conversations/\(try requireConversation())/messages",
            MessagePayload(body: text)
        )
        if !messages.contains(where: { $0.id == saved.id }) {
            messages.append(saved)
            emit(saved)
        }
    }

    public func refresh() async throws {
        guard let conversationId else { return }
        let page: MessagePage = try await get("/v1/conversations/\(conversationId)/messages")
        let known = Set(messages.map(\.id))
        messages = page.messages
        call = page.call
        for message in page.messages where !known.contains(message.id) {
            emit(message)
        }
    }

    public func startCall() async throws {
        guard user != nil else { throw NorthlineError.notIdentified }
        let started: NorthlineCall = try await post(
            "/v1/conversations/\(try requireConversation())/calls",
            EmptyPayload()
        )
        call = started
    }

    public func answer() async throws {
        guard let call, call.phase == .ringing else { return }
        self.call = try await post("/v1/calls/\(call.id)/answer", EmptyPayload())
    }

    public func endCall() async throws {
        guard let call, call.phase != .ended else {
            self.call = nil
            return
        }
        _ = try await post("/v1/calls/\(call.id)/end", EmptyPayload()) as EmptyResult
        self.call = nil
    }

    public func onMessage(_ handler: @escaping (NorthlineMessage) -> Void) {
        handlers.append(handler)
    }

    private func emit(_ message: NorthlineMessage) {
        handlers.forEach { $0(message) }
    }

    private func requireAppId() throws -> String {
        guard let appId else { throw NorthlineError.notStarted }
        return appId
    }

    private func requireConversation() throws -> String {
        guard let conversationId else { throw NorthlineError.notIdentified }
        return conversationId
    }

    private func post<Body: Encodable, Response: Decodable>(_ path: String, _ body: Body) async throws -> Response {
        let data = try JSONEncoder().encode(body)
        return try await perform(NorthlineRequest(method: "POST", path: path, body: data))
    }

    private func get<Response: Decodable>(_ path: String) async throws -> Response {
        try await perform(NorthlineRequest(method: "GET", path: path))
    }

    private func perform<Response: Decodable>(_ request: NorthlineRequest) async throws -> Response {
        guard let transport else { throw NorthlineError.notStarted }
        let response: NorthlineResponse
        do {
            response = try await transport.send(request)
        } catch let error as NorthlineError {
            lastError = String(describing: error)
            throw error
        } catch {
            lastError = error.localizedDescription
            throw error
        }
        guard (200 ..< 300).contains(response.status) else {
            lastError = "HTTP \(response.status)"
            throw NorthlineError.http(response.status)
        }
        if let empty: Response = emptyResult(from: response) {
            return empty
        }
        do {
            return try JSONDecoder().decode(Response.self, from: response.body)
        } catch {
            lastError = "Could not read the server response"
            throw NorthlineError.decoding
        }
    }

    private func emptyResult<Response: Decodable>(from response: NorthlineResponse) -> Response? {
        guard response.body.isEmpty else { return nil }
        return EmptyResult() as? Response
    }
}

private struct IdentifyPayload: Encodable {
    var appId: String
    var channel: NorthlineChannel
    var user: NorthlineUser
}

private struct IdentifyResult: Decodable {
    var customerId: String
    var conversationId: String
}

private struct MessagePayload: Encodable {
    var body: String
}

private struct MessagePage: Decodable {
    var messages: [NorthlineMessage]
    var call: NorthlineCall?
}

private struct EmptyPayload: Encodable {}

private struct EmptyResult: Decodable {}
