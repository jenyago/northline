import Foundation

public enum NorthlineChannel: String, Codable, Sendable {
    case web
    case ios
    case whatsapp
}

public enum NorthlineRole: String, Codable, Sendable {
    case customer
    case agent
    case system
}

public enum NorthlineCallPhase: String, Codable, Sendable {
    case ringing
    case active
    case ended
}

public struct NorthlineUser: Codable, Equatable, Sendable {
    public var userId: String
    public var name: String
    public var email: String?
    public var phone: String?
    public var company: String?

    public init(
        userId: String,
        name: String,
        email: String? = nil,
        phone: String? = nil,
        company: String? = nil
    ) {
        self.userId = userId
        self.name = name
        self.email = email
        self.phone = phone
        self.company = company
    }
}

public struct NorthlineMessage: Identifiable, Codable, Equatable, Sendable {
    public var id: String
    public var body: String
    public var author: String
    public var role: NorthlineRole
    public var at: Int

    public init(id: String, body: String, author: String, role: NorthlineRole, at: Int) {
        self.id = id
        self.body = body
        self.author = author
        self.role = role
        self.at = at
    }
}

public struct NorthlineCall: Identifiable, Codable, Equatable, Sendable {
    public var id: String
    public var phase: NorthlineCallPhase

    public init(id: String, phase: NorthlineCallPhase) {
        self.id = id
        self.phase = phase
    }
}

public enum NorthlineError: Error, Equatable, Sendable {
    case notStarted
    case notIdentified
    case http(Int)
    case decoding
}

public struct NorthlineRequest: Sendable, Equatable {
    public var method: String
    public var path: String
    public var body: Data?

    public init(method: String, path: String, body: Data? = nil) {
        self.method = method
        self.path = path
        self.body = body
    }
}

public struct NorthlineResponse: Sendable {
    public var status: Int
    public var body: Data

    public init(status: Int, body: Data) {
        self.status = status
        self.body = body
    }
}

public protocol NorthlineTransport: Sendable {
    func send(_ request: NorthlineRequest) async throws -> NorthlineResponse
}
