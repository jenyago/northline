import XCTest
@testable import NorthlineKit

final class ScriptedTransport: NorthlineTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [Data]
    private(set) var requests: [NorthlineRequest] = []

    init(responses: [String]) {
        self.responses = responses.map { Data($0.utf8) }
    }

    func send(_ request: NorthlineRequest) async throws -> NorthlineResponse {
        lock.lock()
        requests.append(request)
        let body = responses.isEmpty ? Data() : responses.removeFirst()
        lock.unlock()
        return NorthlineResponse(status: 200, body: body)
    }

    func recorded() -> [NorthlineRequest] {
        lock.lock()
        defer { lock.unlock() }
        return requests
    }
}

@MainActor
final class NorthlineTests: XCTestCase {
    func testIdentifyThenSend() async throws {
        let transport = ScriptedTransport(responses: [
            #"{"customerId":"cus_jonas","conversationId":"cnv_1"}"#,
            #"{"messages":[]}"#,
            #"{"id":"m1","body":"Push is still dead","author":"Jonas Berg","role":"customer","at":1}"#,
        ])
        let client = Northline(transport: transport)
        client.start(appId: "nl_live_fieldwork", baseURL: URL(string: "https://example.com")!)
        try await client.identify(
            NorthlineUser(userId: "cus_jonas", name: "Jonas Berg", email: "jonas@bergcivil.no", company: "Berg Civil")
        )
        try await client.send("Push is still dead")

        let recorded = transport.recorded()
        XCTAssertEqual(recorded.map(\.path), [
            "/v1/customers/identify",
            "/v1/conversations/cnv_1/messages",
            "/v1/conversations/cnv_1/messages",
        ])
        XCTAssertEqual(recorded.map(\.method), ["POST", "GET", "POST"])
        let body = try XCTUnwrap(recorded[0].body)
        let json = try JSONSerialization.jsonObject(with: body) as? [String: Any]
        XCTAssertEqual(json?["appId"] as? String, "nl_live_fieldwork")
        XCTAssertEqual(json?["channel"] as? String, "ios")
        XCTAssertEqual(client.messages.map(\.body), ["Push is still dead"])
    }

    func testSendBeforeIdentifyThrows() async throws {
        let client = Northline(transport: ScriptedTransport(responses: []))
        client.start(appId: "nl_live_fieldwork", baseURL: URL(string: "https://example.com")!)
        do {
            try await client.send("Hello")
            XCTFail("Expected notIdentified")
        } catch NorthlineError.notIdentified {
            return
        }
    }

    func testStartCall() async throws {
        let transport = ScriptedTransport(responses: [
            #"{"customerId":"cus_jonas","conversationId":"cnv_1"}"#,
            #"{"messages":[],"call":null}"#,
            #"{"id":"call_1","phase":"ringing"}"#,
        ])
        let client = Northline(transport: transport)
        client.start(appId: "nl_live_fieldwork", baseURL: URL(string: "https://example.com")!)
        try await client.identify(NorthlineUser(userId: "cus_jonas", name: "Jonas Berg"))
        try await client.startCall()
        XCTAssertEqual(client.call, NorthlineCall(id: "call_1", phase: .ringing))
        XCTAssertEqual(transport.recorded().last?.path, "/v1/conversations/cnv_1/calls")
    }
}
